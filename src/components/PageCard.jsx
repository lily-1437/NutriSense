// src/components/PageCard.jsx
//
// Shared card container used across Analyze Recipe, Profile, Health Goals,
// etc. (per UI Component Guide's "truly shared" list). Plain MUI Card with
// the theme's border-radius token, no built-in motion of its own -- pages
// wrap it in whatever entrance variant (scaleIn/fadeUp) fits their context,
// keeping this component a dumb visual shell.

import { Card } from '@mui/material';

export default function PageCard({ children, sx = {}, ...props }) {
  return (
    <Card
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        borderRadius: (theme) => `${theme.shape.borderRadius}px`,
        border: '1px solid',
        borderColor: 'rgba(63, 71, 40, 0.08)', // faint text.primary-tinted hairline, stays inside the 4-color system
        ...sx,
      }}
      {...props}
    >
      {children}
    </Card>
  );
}
