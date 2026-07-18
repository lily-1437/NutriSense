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
            C82,28 98,28 180,50
            C262,78 278,78 360,50
            C442,28 458,28 540,50
            C622,78 638,78 720,50
            C802,28 818,28 900,50
            C982,78 998,78 1080,50
            C1162,28 1178,28 1260,50
            C1342,78 1358,78 1440,50
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
