import * as React from 'react';

export interface GenericTableColumn {
  key: string;
  label: string;
  render?: (value: any, row: any, rowIndex: number) => React.ReactNode;
  className?: string;
}

export interface GenericTableProps {
  columns: GenericTableColumn[];
  data: any[];
  footer?: React.ReactNode;
}

export const GenericTable: React.FC<GenericTableProps> = ({ columns, data, footer }) => (
  <div className="expenses-table-container">
    <table className="expenses-table">
      <thead>
        <tr>
          {columns.map(col => (
            <th key={col.key} className={col.className || ''}>{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            {columns.map(col => (
              <td key={col.key} className={col.className || ''}>
                {col.render ? col.render(row[col.key], row, i) : row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
      {footer && (
        <tfoot>
          <tr>
            <td colSpan={columns.length}>{footer}</td>
          </tr>
        </tfoot>
      )}
    </table>
  </div>
);

const MOCK_DATA = [
  { name: 'OpenPhone', cycle: 'Annual', amount: 'C$245', category: 'Subscription', lastStatement: '', statementNum: '' },
  { name: 'goPeer (2/2)', cycle: 'Monthly', amount: 'C$330', category: 'Loan', lastStatement: '', statementNum: '15' },
  { name: 'Employee Pay (2/2)', cycle: 'Bi-weekly', amount: 'C$840', category: 'Employee Pay', lastStatement: '', statementNum: '15' },
];

const CATEGORY_COLORS: Record<string, string> = {
  'Subscription': 'badge-green',
  'Loan': 'badge-yellow',
  'Employee Pay': 'badge-gold',
  'Utilities': 'badge-red',
  'Insurance': 'badge-orange',
};
const CYCLE_COLORS: Record<string, string> = {
  'Annual': 'badge-blue',
  'Monthly': 'badge-cyan',
  'Bi-weekly': 'badge-purple',
};

export const GenericTableDemo = () => (
  <GenericTable
    columns={[
      {
        key: 'checkbox',
        label: '',
        render: () => <input type="checkbox" className="expenses-checkbox" />,
        className: 'expenses-col-checkbox',
      },
      {
        key: 'icon',
        label: '',
        render: (v, row) => (
          <span className={`expenses-icon-circle icon-${row.category.replace(/\s/g, '').toLowerCase()}`}>{row.name[0]}</span>
        ),
        className: 'expenses-col-icon',
      },
      { key: 'name', label: 'Name', className: 'expenses-col-name', render: (v) => <span className="expenses-name">{v}</span> },
      { key: 'cycle', label: 'Cycle', className: 'expenses-col-cycle', render: (v) => <span className={`expenses-badge ${CYCLE_COLORS[v] || ''}`}>{v}</span> },
      { key: 'amount', label: 'Amount', className: 'expenses-col-amount', render: (v) => <span className="expenses-amount">{v}</span> },
      { key: 'category', label: 'Category', className: 'expenses-col-category', render: (v) => <span className={`expenses-badge ${CATEGORY_COLORS[v] || ''}`}>{v}</span> },
      { key: 'lastStatement', label: 'Last Statement', className: 'expenses-col-muted', render: (v) => <span className="expenses-muted">{v || '—'}</span> },
      { key: 'statementNum', label: 'Statement #', className: 'expenses-col-muted', render: (v) => <span className="expenses-muted">{v || '—'}</span> },
    ]}
    data={MOCK_DATA}
  />
); 