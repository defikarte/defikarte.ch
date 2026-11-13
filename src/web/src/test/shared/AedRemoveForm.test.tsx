import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AxiosError, type AxiosResponse } from 'axios';
import { describe, expect, it, vi } from 'vitest';
import { AedRemoveForm, type ApiClient } from '@defikarte/shared';

// i18n is not initialised in tests, so t() returns the keys
const renderForm = (requestAedRemoval = vi.fn().mockResolvedValue({})) => {
  const handlers = {
    onCancel: vi.fn(),
    onRemoved: vi.fn().mockResolvedValue(undefined),
    onNotify: vi.fn(),
  };
  render(
    <AedRemoveForm
      id="42"
      apiClient={{ requestAedRemoval } as unknown as ApiClient}
      reporter="Anna"
      {...handlers}
    />
  );
  return { requestAedRemoval, ...handlers };
};

describe('AedRemoveForm', () => {
  it('tells permanent removal apart from temporary failures', () => {
    renderForm();

    expect(screen.getByText('removeAedNoticeTitle')).toBeInTheDocument();
    expect(screen.getByText('removeAedNoticeContent')).toBeInTheDocument();
  });

  it('does not request a removal without a reason', async () => {
    const { requestAedRemoval } = renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'removeAedSubmit' }));

    await waitFor(() => expect(requestAedRemoval).not.toHaveBeenCalled());
  });

  it('requests the removal with reason, comment and the reporter of the edit form', async () => {
    const { requestAedRemoval, onRemoved, onNotify } = renderForm();

    fireEvent.change(screen.getByLabelText(/removeAedReason/), { target: { value: 'stolen' } });
    fireEvent.change(screen.getByLabelText(/removeAedComment/), { target: { value: 'Seit Mai' } });
    fireEvent.click(screen.getByRole('button', { name: 'removeAedSubmit' }));

    await waitFor(() =>
      expect(requestAedRemoval).toHaveBeenCalledWith('42', {
        reason: 'stolen',
        comment: 'Seit Mai',
        reporter: 'Anna',
      })
    );
    expect(onNotify).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
    expect(onRemoved).toHaveBeenCalled();
  });

  it('reports an error and keeps the form open', async () => {
    const { onRemoved, onNotify } = renderForm(vi.fn().mockRejectedValue(new Error('offline')));

    fireEvent.change(screen.getByLabelText(/removeAedReason/), { target: { value: 'destroyed' } });
    fireEvent.click(screen.getByRole('button', { name: 'removeAedSubmit' }));

    await waitFor(() =>
      expect(onNotify).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', message: 'offline' })
      )
    );
    expect(onRemoved).not.toHaveBeenCalled();
  });

  it('shows a translated message when the rate limit is reached', async () => {
    const rateLimited = new AxiosError('Request failed with status code 429');
    rateLimited.response = { status: 429 } as AxiosResponse;
    const { onRemoved, onNotify } = renderForm(vi.fn().mockRejectedValue(rateLimited));

    fireEvent.change(screen.getByLabelText(/removeAedReason/), { target: { value: 'destroyed' } });
    fireEvent.click(screen.getByRole('button', { name: 'removeAedSubmit' }));

    await waitFor(() =>
      expect(onNotify).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', message: 'tooManyRequests' })
      )
    );
    expect(onRemoved).not.toHaveBeenCalled();
  });

  it('goes back to the edit form on cancel', () => {
    const { onCancel } = renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'cancel' }));

    expect(onCancel).toHaveBeenCalled();
  });
});
