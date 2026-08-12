export interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="state-block state-block--error">
      <p className="state-block__title">Couldn't reach the job board</p>
      <p>{message}</p>
      {onRetry && (
        <button className="btn state-block__retry" type="button" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}
