import { Chip } from '@mui/material';

const colorMap: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
  completed: 'success', succeeded: 'success', active: 'success', resolved: 'success', confirmed: 'success', paid: 'success',
  failed: 'error', cancelled: 'error', rejected: 'error', dismissed: 'error',
  pending: 'warning', draft: 'warning', processing: 'warning', requires_payment: 'warning',
  published: 'info', in_progress: 'info', in_transit: 'info', accepted: 'info', delivered: 'info',
};

export default function StatusChip({ status }: { status: string }) {
  return <Chip label={status} size="small" color={colorMap[status] || 'default'} />;
}
