# Character Size Preference System - Legacy Layout Fix

## 🎯 **Problem Solved**

Old accounts were displaying characters at an extremely large size (`max-width: min(98vw, 1200px)`) due to legacy CSS configurations. This made characters take up 30-40% of the screen height, creating an inconsistent experience compared to new accounts.

## 🔧 **Solution Implemented**

### **1. Character Size Preference System**
- **New Field**: Added `character_size` to `user_settings` table
- **Three Sizes**: `small` (new default), `medium` (current large), `large` (accessibility)
- **User Choice**: Users can now select their preferred character size

### **2. Dynamic CSS Sizing**
- **CSS Variables**: Replaced hardcoded sizes with CSS custom properties
- **Size Classes**: `.size-small`, `.size-medium`, `.size-large` classes
- **Responsive**: Sizes scale appropriately across different screen sizes

### **3. Backward Compatibility**
- **Old Accounts**: Automatically set to `medium` size (preserves current experience)
- **New Accounts**: Default to `small` size (new standard)
- **Reset Function**: Old accounts can reset to new default size

## 📊 **Size Specifications**

| Size | Max Width | Max Height | Use Case |
|------|-----------|------------|----------|
| **Small** | `min(60vw, 400px)` | `min(60vw, 400px)` | New default, recommended |
| **Medium** | `min(80vw, 800px)` | `min(80vw, 800px)` | Current large size |
| **Large** | `min(98vw, 1200px)` | `min(98vw, 1200px)` | Accessibility, high contrast |

## 🚀 **Implementation Details**

### **Database Changes**
```sql
-- Add character_size column to user_settings
ALTER TABLE user_settings 
ADD COLUMN character_size VARCHAR(20) DEFAULT 'small' 
CHECK (character_size IN ('small', 'medium', 'large'));

-- Set existing users to medium size (backward compatibility)
UPDATE user_settings 
SET character_size = 'medium' 
WHERE character_size IS NULL OR character_size = 'small';
```

### **CSS Implementation**
```css
.character-dynamic {
  /* Default to small size */
  --character-max-width: min(60vw, 400px);
  --character-max-height: min(60vw, 400px);
  
  max-width: var(--character-max-width);
  max-height: var(--character-max-height);
}

/* Size variants */
.character-dynamic.size-small {
  --character-max-width: min(60vw, 400px);
  --character-max-height: min(60vw, 400px);
}

.character-dynamic.size-medium {
  --character-max-width: min(80vw, 800px);
  --character-max-height: min(80vw, 800px);
}

.character-dynamic.size-large {
  --character-max-width: min(98vw, 1200px);
  --character-max-height: min(98vw, 1200px);
}
```

### **React Hook**
```typescript
// apps/web/hooks/useCharacterSize.ts
export function useCharacterSize() {
  const { characterSize, setCharacterSize, resetToDefault, isLoading, error } = useCharacterSize();
  
  // Loads from database or localStorage
  // Applies size class to body element
  // Handles authentication state
}
```

### **Component Integration**
```typescript
// Apply size class to character images
<img 
  className={`character-dynamic size-${characterSize} pixel-art`}
  src={getCharacterImage(equippedCharacter)}
  alt="Tiny Adventurer"
/>
```

## 🎮 **User Experience**

### **For Old Accounts**
1. **Automatic**: Characters remain at current large size
2. **Optional**: Can reset to new small size via settings
3. **Settings**: Access via gear icon (⚙️) near character

### **For New Accounts**
1. **Default**: Characters use new small size
2. **Customizable**: Can change to medium or large if preferred
3. **Consistent**: Same experience across all new users

### **Settings Access**
- **Location**: Small gear icon (⚙️) positioned above character
- **Modal**: Clean interface to choose size preference
- **Reset**: Button to return to new default size

## 🔄 **Migration Process**

### **1. Database Migration**
```bash
# Run the migration
psql -d your_database -f supabase/migrations/20250128_add_character_size_preference.sql
```

### **2. Deploy Code Changes**
- Update CSS with new dynamic sizing
- Deploy React components with size preference system
- Add character size settings UI

### **3. User Notification**
- Old accounts see gear icon for size adjustment
- Optional notification about new size options
- Clear path to reset to new default

## 🧪 **Testing**

### **Manual Testing**
1. **Old Account**: Verify characters remain large by default
2. **Size Change**: Test switching between small/medium/large
3. **Reset Function**: Verify reset to small size works
4. **Persistence**: Check that preferences save to database

### **Automated Testing**
```typescript
// Test character size application
test('applies correct size class to character', () => {
  render(<CharacterImage characterSize="small" />);
  expect(screen.getByAltText('Tiny Adventurer')).toHaveClass('size-small');
});

// Test size preference persistence
test('saves character size preference', async () => {
  const { setCharacterSize } = renderHook(() => useCharacterSize());
  await setCharacterSize('large');
  expect(localStorage.getItem('character-size')).toBe('large');
});
```

## 📱 **Mobile Considerations**

### **Responsive Design**
- **Small screens**: Sizes scale with viewport width
- **Touch targets**: Settings button is appropriately sized
- **Performance**: CSS variables provide smooth transitions

### **Accessibility**
- **High contrast**: Large size recommended for accessibility
- **Screen readers**: Proper labels and descriptions
- **Keyboard navigation**: All controls accessible via keyboard

## 🔮 **Future Enhancements**

### **Potential Features**
1. **Per-device sizing**: Remember size preference per device
2. **Auto-sizing**: Smart size detection based on screen size
3. **Animation**: Smooth transitions between size changes
4. **Presets**: Quick size presets (compact, standard, accessibility)

### **Performance Optimizations**
1. **Lazy loading**: Load size preferences on demand
2. **Caching**: Cache size preferences in localStorage
3. **Debouncing**: Prevent rapid size changes during interactions

## 🐛 **Troubleshooting**

### **Common Issues**
1. **Size not applying**: Check CSS class application
2. **Preference not saving**: Verify database connection
3. **Old size persisting**: Clear localStorage and refresh

### **Debug Commands**
```typescript
// Check current size preference
console.log('Character size:', useCharacterSize().characterSize);

// Check applied CSS classes
console.log('Body classes:', document.body.className);

// Reset to default
await useCharacterSize().resetToDefault();
```

## 📚 **Related Documentation**
- [Soft Shield Implementation](./README_SOFT_SHIELD.md)
- [Database Schema](./supabase/README.md)
- [Component Architecture](./components/README.md)

---

**Status**: ✅ **Implemented and Ready for Testing**

This system provides a clean solution to the legacy character sizing issue while maintaining backward compatibility and giving users control over their experience.
