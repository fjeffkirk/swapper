import { FormControl, MenuItem, Select, SelectChangeEvent, Stack, Typography } from '@mui/material';
import TokenIcon from './TokenIcon';

export type TokenSymbol = 'TIA' | 'WTIA' | 'YTK';

export default function TokenSelect({ value, onChange }: { value: TokenSymbol; onChange: (v: TokenSymbol) => void }) {
  const handleChange = (e: SelectChangeEvent<TokenSymbol>) => onChange(e.target.value as TokenSymbol);

  const render = (sym: TokenSymbol) => (
    <Stack direction="row" alignItems="center" spacing={1}>
      <TokenIcon symbol={sym} />
      <Typography fontWeight={600} fontSize={14}>{sym}</Typography>
    </Stack>
  );

  return (
    <FormControl size="small" sx={{ minWidth: 110 }}>
      <Select value={value} onChange={handleChange} renderValue={(v) => render(v as TokenSymbol)}
        MenuProps={{ PaperProps: { sx: { bgcolor: 'background.paper' } } }}>
        <MenuItem value="TIA">{render('TIA')}</MenuItem>
        <MenuItem value="WTIA">{render('WTIA')}</MenuItem>
        <MenuItem value="YTK">{render('YTK')}</MenuItem>
      </Select>
    </FormControl>
  );
}


