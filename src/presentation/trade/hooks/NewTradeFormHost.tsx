import { forwardRef, useImperativeHandle } from 'react';
import { useNewTradeForm } from './useNewTradeForm';

// HostProps derived from the hook parameter types to avoid duplicating the shape
export type NewTradeFormHostProps = Parameters<typeof useNewTradeForm>[0];
export type NewTradeFormApi = ReturnType<typeof useNewTradeForm>;

// ForwardRef host component exposing the hook API via ref with correct types (no `any`).
export const NewTradeFormHost = forwardRef<NewTradeFormApi | null, NewTradeFormHostProps>(
  (props, ref) => {
    const api = useNewTradeForm(props);
    useImperativeHandle(ref, () => api, [api]);
    // Host does not render anything; it's purely an imperative bridge for tests or parents.
    return null;
  }
);

export default NewTradeFormHost;

