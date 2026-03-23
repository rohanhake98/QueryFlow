import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { DataTable } from '@/components/charts/DataTable';

const columns = [
  { name: 'customer_name', type: 'text' },
  { name: 'total_spend', type: 'number' },
];

const rows = [
  { customer_name: 'Charlie', total_spend: 150 },
  { customer_name: 'Alice', total_spend: 320 },
  { customer_name: 'Bob', total_spend: 220 },
];

describe('DataTable', () => {
  it('sorts rows when clicking a sortable header', () => {
    render(<DataTable columns={columns} rows={rows} />);

    const sortButton = screen.getByRole('button', { name: /sort by total spend/i });
    fireEvent.click(sortButton);

    const cells = screen.getAllByRole('cell').map((cell) => cell.textContent);
    expect(cells[1]).toBe('150');

    fireEvent.click(sortButton);
    const cellsAfterDesc = screen.getAllByRole('cell').map((cell) => cell.textContent);
    expect(cellsAfterDesc[1]).toBe('320');
  });

  it('renders empty state when there are no rows', () => {
    render(<DataTable columns={columns} rows={[]} />);
    expect(screen.getByText('No rows returned.')).toBeInTheDocument();
  });
});
