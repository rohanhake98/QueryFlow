import DashboardPage from '@/app/(dashboard)/dashboard/page';
import { useConnections } from '@/hooks/useConnections';
import { queryApi } from '@/lib/api';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('next/dynamic', () => () => function MockDynamic() { return <div>SQL Preview</div>; });
jest.mock('@/components/query/ResultsPanel', () => ({ ResultsPanel: () => <div>Results Panel</div> }));
jest.mock('@/components/query/QueryStatusBar', () => ({ QueryStatusBar: () => <div>Loading Status</div> }));
jest.mock('@/hooks/useConnections', () => ({ useConnections: jest.fn() }));
jest.mock('@/lib/api', () => ({ queryApi: { ask: jest.fn() } }));

const mockedUseConnections = useConnections as jest.Mock;
const mockedAsk = queryApi.ask as jest.Mock;

describe('DashboardPage', () => {
  it('executes query flow when connection and question are provided', async () => {
    mockedUseConnections.mockReturnValue({
      data: [
        {
          id: 'conn-1',
          display_name: 'Primary DB',
          db_type: 'postgresql',
          host: 'localhost',
          database_name: 'analytics',
          schema_cached_at: null,
          is_active: true,
        },
      ],
      isLoading: false,
    });

    mockedAsk.mockResolvedValue({
      data: {
        query_id: 'q1',
        question: 'Top customers',
        generated_sql: 'select 1',
        was_corrected: false,
        execution_time_ms: 123,
        result: { columns: [{ name: 'v', type: 'number' }], rows: [{ v: 1 }], row_count: 1 },
        visualization: { chart_type: 'table' },
      },
    });

    render(<DashboardPage />);

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'conn-1' } });
    fireEvent.change(screen.getByLabelText('Ask a question'), { target: { value: 'Top customers' } });
    fireEvent.click(screen.getByRole('button', { name: /run query/i }));

    await waitFor(() => expect(mockedAsk).toHaveBeenCalledWith('conn-1', 'Top customers'));
    expect(await screen.findByText('Results Panel')).toBeInTheDocument();
  });
});
