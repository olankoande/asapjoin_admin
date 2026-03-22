import { useQuery } from '@tanstack/react-query';
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper, CircularProgress, Alert } from '@mui/material';
import { auditLogsApi } from '../../api/endpoints';
import { getApiError } from '../../api/httpClient';
import { formatDate } from '../../utils/format';

export default function AuditLogsPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ['admin-audit-logs'], queryFn: () => auditLogsApi.list().then(r => r.data) });
  return (
    <Box>
      <Typography variant="h4" mb={3}>Audit Logs</Typography>
      {error && <Alert severity="error">{getApiError(error).message}</Alert>}
      {isLoading ? <CircularProgress /> : (
        <TableContainer component={Paper}><Table size="small">
          <TableHead><TableRow>
            <TableCell>Date</TableCell><TableCell>Admin</TableCell><TableCell>Action</TableCell>
            <TableCell>Cible</TableCell><TableCell>Détails</TableCell>
          </TableRow></TableHead>
          <TableBody>{data?.map(log => (
            <TableRow key={String(log.id)}>
              <TableCell>{formatDate(log.created_at)}</TableCell>
              <TableCell>{log.admin ? `${log.admin.first_name} ${log.admin.last_name}` : String(log.admin_id)}</TableCell>
              <TableCell>{log.action}</TableCell>
              <TableCell>{log.entity_type}:{String(log.entity_id)}</TableCell>
              <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {log.details_json || '—'}
              </TableCell>
            </TableRow>
          ))}</TableBody>
        </Table></TableContainer>
      )}
    </Box>
  );
}
