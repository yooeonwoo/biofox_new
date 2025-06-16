import { CustomerCard } from './components/CustomerCard';

export default function App() {
  const sampleCustomers = [
    {
      name: '홍길동 원장',
      number: '01050001234',
      region: '서울',
      assignee: '김담당',
      manager: '이관리',
    },
    {
      name: '김고객 원장',
      number: '01050005678', 
      region: '부산',
      assignee: '박담당',
      manager: '최관리',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-5">
      <div className="max-w-md mx-auto">
        <h1 className="text-center mb-6">고객 관리 시스템</h1>
        {sampleCustomers.map((customer, index) => (
          <CustomerCard key={index} customer={customer} cardNumber={index + 1} />
        ))}
      </div>
    </div>
  );
}