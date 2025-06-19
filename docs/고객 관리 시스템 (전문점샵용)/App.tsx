import { CustomerCard } from './components/CustomerCard';

export default function App() {
  const sampleCustomers = [
    {
      name: '홍길동 원장',
      contractDate: '2024-01-15',
      manager: '이관리',
    },
    {
      name: '김고객 원장',
      contractDate: '2024-02-20',
      manager: '최관리',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-5">
      <div className="max-w-md mx-auto">
        <h1 className="text-center mb-6">셀프 성장 시스템</h1>
        {sampleCustomers.map((customer, index) => (
          <CustomerCard key={index} customer={customer} cardNumber={index + 1} />
        ))}
      </div>
    </div>
  );
}