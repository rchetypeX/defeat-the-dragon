import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerSupabaseClient } from '../../../../lib/supabase';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' })
  : null;

async function syncSubscription(userId: string, status: string, expiresAt?: number | null) {
  const supabase = createServerSupabaseClient();
  const isActive = status === 'active' || status === 'trialing';

  const { error: subscriptionError } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      provider: 'stripe',
      status,
      expires_at: expiresAt ? new Date(expiresAt * 1000).toISOString() : null,
    });

  if (subscriptionError) {
    throw subscriptionError;
  }

  const { error: playerError } = await supabase
    .from('players')
    .update({ is_inspired: isActive })
    .eq('user_id', userId);

  if (playerError) {
    throw playerError;
  }
}

function getSubscriptionUserId(subscription: Stripe.Subscription) {
  return subscription.metadata?.user_id;
}

export async function POST(request: NextRequest) {
  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: 'Stripe webhook is not configured' },
      { status: 500 }
    );
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json(
      { error: 'Missing Stripe signature' },
      { status: 400 }
    );
  }

  const body = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid webhook signature';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const subscriptionId = typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id;

      if (userId && subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await syncSubscription(userId, subscription.status, subscription.current_period_end);
      }
    }

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = getSubscriptionUserId(subscription);

      if (userId) {
        await syncSubscription(userId, subscription.status, subscription.current_period_end);
      }
    }
  } catch (error) {
    console.error('Stripe webhook sync failed:', error);
    return NextResponse.json(
      { error: 'Webhook handling failed' },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
