import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { DeliveryStageValue } from '@/lib/types/customer';
import { Id } from '@/convex/_generated/dataModel';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/** shopId == customerId */
export async function getInstallInfo(shopId: string) {
  try {
    // shopId를 Convex ID 형태로 변환
    const customerId = shopId as Id<'customers'>;

    // Convex에서 고객 데이터 조회
    const customerData = await convex.query(api.customers.getCustomerById, {
      customerId: customerId,
    });

    if (!customerData || !customerData.customer_progress) {
      throw new Error('Customer progress not found');
    }

    const delivery = (customerData.customer_progress.stage_data?.delivery ||
      {}) as DeliveryStageValue;

    return {
      date: delivery.installDate || '',
      name: delivery.installContactName || '',
      phone: delivery.installContactPhone || '',
    };
  } catch (error) {
    console.warn('getInstallInfo: Convex 호출 실패, 모킹 데이터 반환', error);

    // 개발 환경에서 모킹 데이터 반환
    return {
      date: '2024-01-15',
      name: '설치 담당자',
      phone: '010-1234-5678',
    };
  }
}
