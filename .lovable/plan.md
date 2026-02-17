

## Improve Button Looks + Fix Build Errors

### 1. Fix Build Errors (Critical)

There are 3 build errors that must be fixed first:

- **`html2canvas` is not defined** in both `Index.tsx` (line 150) and `Admin.tsx` (line 169) -- the `handleExportPNG` function references `html2canvas` which was never imported or installed. Since this feature isn't wired to any UI button, the simplest fix is to remove these dead functions entirely.
- **`loadMembers()` returns a Promise** but `Index.tsx` line 100 passes it directly to `setMembers`. Will wrap it with `.then()` like the other calls.

### 2. Enhanced 3D Button Styling

Upgrade the button component with a more premium, tactile 3D effect:

- **Deeper shadow layers**: Use a thicker bottom "edge" shadow (5px instead of 4px) with a subtle gradient highlight on top to simulate a raised surface.
- **Rounded corners**: Increase to `rounded-xl` for a softer, more modern feel.
- **Smooth press animation**: Add `duration-150` for snappier active state transitions, with `active:translate-y-[3px]` for a more satisfying press depth.
- **Hover glow**: Add a subtle background brightness boost on hover for the default and destructive variants.
- **Better outline variant**: Add an inset shadow to give outline buttons more depth instead of just a flat border.

### 3. Files to Modify

| File | Changes |
|------|---------|
| `src/components/ui/button.tsx` | Reworked 3D shadow system with deeper edges, glow effects, snappier transitions, and rounded-xl corners |
| `src/pages/Index.tsx` | Fix `loadMembers()` Promise handling (line 100); remove dead `handleExportPNG` function |
| `src/pages/Admin.tsx` | Remove dead `handleExportPNG` function |

