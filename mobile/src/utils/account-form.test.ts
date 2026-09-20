import { accountToFormValues, formValuesToUpdatePayload } from './account-form';

describe('account-form utils', () => {
  it('maps API account to form values', () => {
    const values = accountToFormValues({
      id: 'a1',
      name: 'HDFC',
      type: 'SAVINGS',
      openingBalance: '1500.50' as unknown as number,
      currency: 'INR',
      icon: null,
      color: null,
      isArchived: false,
      createdAt: '',
      updatedAt: '',
    });
    expect(values.openingBalance).toBe(1500.5);
    expect(values.icon).toBe('');
  });

  it('builds update payload without empty icon/color', () => {
    const payload = formValuesToUpdatePayload({
      name: 'HDFC',
      type: 'SAVINGS',
      openingBalance: 100,
      currency: 'INR',
      icon: '',
      color: '  ',
    });
    expect(payload.icon).toBeUndefined();
    expect(payload.color).toBeUndefined();
  });
});
