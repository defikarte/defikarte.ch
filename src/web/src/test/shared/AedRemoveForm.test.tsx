import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AedRemoveForm, type ApiClient } from '@defikarte/shared';

// i18n is not initialised in tests, so t() returns the keys
const renderForm = (deleteAedData = vi.fn().mockResolvedValue({})) => {
  const handlers = {
    onCancel: vi.fn(),
    onRemoved: vi.fn().mockResolvedValue(undefined),
    onNotify: vi.fn(),
  };
  render(
    <AedRemoveForm
      id="42"
      apiClient={{ deleteAedData } as unknown as ApiClient}
      reporter="Anna"
      {...handlers}
    />
  );
  return { deleteAedData, ...handlers };
};

describe('AedRemoveForm', () => {
  it('tells permanent removal apart from temporary failures', () => {
    renderForm();

    expect(screen.getByText('removeAedNoticeTitle')).toBeInTheDocument();
    expect(screen.getByText('removeAedNoticeContent')).toBeInTheDocument();
  });

  it('does not delete without a reason', async () => {
    const { deleteAedData } = renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'removeAedSubmit' }));

    await waitFor(() => expect(deleteAedData).not.toHaveBeenCalled());
  });

  it('deletes the AED with reason, comment and the reporter of the edit form', async () => {
    const { deleteAedData, onRemoved, onNotify } = renderForm();

    fireEvent.change(screen.getByLabelText(/removeAedReason/), { target: { value: 'stolen' } });
    fireEvent.change(screen.getByLabelText(/removeAedComment/), { target: { value: 'Seit Mai' } });
    fireEvent.click(screen.getByRole('button', { name: 'removeAedSubmit' }));

    await waitFor(() =>
      expect(deleteAedData).toHaveBeenCalledWith('42', {
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

  it('goes back to the edit form on cancel', () => {
    const { onCancel } = renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'cancel' }));

    expect(onCancel).toHaveBeenCalled();
  });
});
