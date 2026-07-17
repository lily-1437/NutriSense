import { Box } from '@mui/material';

/**
 * Reusable sine-wave divider.
 * position="bottom" (default): sits at the bottom of the section, wave dips down.
 * position="top": sits at the top of the section, wave rises up — used for Footer.
 */
export default function WaveDivider({ toColor = '#FAF3E7', flip = false, position = 'bottom' }) {
  return (
    <Box
      sx={{
        position: 'absolute',
        ...(position === 'top' ? { top: -1 } : { bottom: -1 }),
        left: 0,
        width: '100%',
        lineHeight: 0,
        transform: (position === 'top' ? !flip : flip) ? 'scaleY(-1)' : 'none',
      }}
    >
      <svg
        viewBox="0 0 1440 100"
        preserveAspectRatio="none"
        style={{ display: 'block', width: '100%', height: 70 }}
      >
        <path
          d="
            M0,50
            C82,25 98,25 180,50
            C262,75 278,75 360,50
            C442,25 458,25 540,50
            C622,75 638,75 720,50
            C802,25 818,25 900,50
            C982,75 998,75 1080,50
            C1162,25 1178,25 1260,50
            C1342,75 1358,75 1440,50
            L1440,105
            L0,105
            Z
          "
          fill={toColor}
        />
      </svg>
    </Box>
  );
}
