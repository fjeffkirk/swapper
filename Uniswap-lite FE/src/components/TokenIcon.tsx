import { SvgIconProps, Box } from '@mui/material';
import TIA from '../assets/tia.svg';
import YTK from '../assets/ytk.svg';

export default function TokenIcon(props: SvgIconProps & { symbol?: 'TIA' | 'WTIA' | 'YTK'; size?: number }) {
  const { symbol = 'TIA', size = 20, ...rest } = props as any;
  const src = symbol === 'YTK' ? YTK : TIA; // WTIA shares TIA icon
  return <Box component="img" src={src} alt={symbol} sx={{ width: size, height: size, verticalAlign: 'middle', borderRadius: '50%' }} {...(rest as any)} />
}


