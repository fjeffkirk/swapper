import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#1DA1F2' },
    background: { default: '#0b0b0e', paper: '#13131a' },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily:
      "Inter, system-ui, -apple-system, 'SF Pro Text', 'Segoe UI', Roboto, Ubuntu, Cantarell, 'Noto Sans', Helvetica, Arial",
    h6: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 700 },
  },
});


