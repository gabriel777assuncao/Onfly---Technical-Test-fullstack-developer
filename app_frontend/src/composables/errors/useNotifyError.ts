import { Notify } from 'quasar';
import { humanizeDomainError } from 'src/ui/errorMessages';
import type { DomainError } from 'src/domain/errors';

type NotifyErrorComposable = {
  notifyError: (error: DomainError) => void;
};

export function useNotifyError(): NotifyErrorComposable {
  function notifyError(error: DomainError): void {
    Notify.create({
      type: 'negative',
      message: humanizeDomainError(error),
      position: 'top-right',
    });
  }

  return { notifyError };
}
