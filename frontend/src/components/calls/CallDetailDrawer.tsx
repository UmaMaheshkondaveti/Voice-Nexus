import { Drawer } from '../ui/Drawer';
import { CallDetailBody } from './CallDetailBody';
import type { EnrichedCall } from '../../types/analytics';
import { formatDateTime } from '../../utils/format';

export function CallDetailDrawer({ call, onClose }: { call: EnrichedCall | null; onClose: () => void }) {
  return (
    <Drawer
      open={call !== null}
      onClose={onClose}
      title={call?.callerName ?? call?.phoneNumber ?? 'Call detail'}
      subtitle={
        call
          ? [call.phoneNumber === '—' ? null : call.phoneNumber, formatDateTime(call.startedAt)].filter(Boolean).join(' · ')
          : undefined
      }
      width={520}
    >
      {call && <CallDetailBody call={call} />}
    </Drawer>
  );
}
