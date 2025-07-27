import { useMemo } from 'react';
import type { ClinicalCase, RoundCustomerInfo } from '@/types/clinical';

/**
 * 케이스와 라운드 정보를 통합하는 함수 (훅이 아닌 일반 함수)
 * 라운드 정보는 케이스 데이터 내의 metadata에서 추출
 */
export function enrichCasesWithRoundInfo(cases: ClinicalCase[]): ClinicalCase[] {
  return cases.map(case_ => {
    // 라운드 정보를 메타데이터에서 안전하게 추출 (as any 제거)
    const metadata = case_.metadata || {};
    const roundInfoFromMetadata = (metadata as any).roundInfo || {};
    const roundCustomerInfo: { [roundDay: number]: RoundCustomerInfo } = {};

    // 저장된 라운드 정보가 있으면 사용
    if (Object.keys(roundInfoFromMetadata).length > 0) {
      for (const [roundNumber, info] of Object.entries(roundInfoFromMetadata)) {
        // 타입 안전성을 위해 옵셔널 체이닝 사용
        if (info && typeof info === 'object') {
          const roundData = info as Record<string, any>;
          roundCustomerInfo[parseInt(roundNumber)] = {
            age: roundData.age,
            gender: roundData.gender,
            treatmentType: roundData.treatmentType || '',
            products: Array.isArray(roundData.products) ? roundData.products : [],
            skinTypes: Array.isArray(roundData.skinTypes) ? roundData.skinTypes : [],
            memo: roundData.memo || '',
            date: roundData.treatmentDate || '',
          };
        }
      }
    }

    // 1라운드가 없으면 기본값으로 생성
    if (!roundCustomerInfo[1]) {
      // 메타데이터에서 체크박스 정보 추출 (타입 안전)
      const productTypes = [];
      if ((metadata as any).cureBooster) productTypes.push('cure_booster');
      if ((metadata as any).cureMask) productTypes.push('cure_mask');
      if ((metadata as any).premiumMask) productTypes.push('premium_mask');
      if ((metadata as any).allInOneSerum) productTypes.push('all_in_one_serum');

      const skinTypeData = [];
      if ((metadata as any).skinRedSensitive) skinTypeData.push('red_sensitive');
      if ((metadata as any).skinPigment) skinTypeData.push('pigment');
      if ((metadata as any).skinPore) skinTypeData.push('pore');
      if ((metadata as any).skinTrouble) skinTypeData.push('acne_trouble');
      if ((metadata as any).skinWrinkle) skinTypeData.push('wrinkle');
      if ((metadata as any).skinEtc) skinTypeData.push('other');

      roundCustomerInfo[1] = {
        age: case_.customerInfo?.age,
        gender: case_.customerInfo?.gender,
        treatmentType: case_.customerInfo?.treatmentType || '',
        products: productTypes.length > 0 ? productTypes : case_.customerInfo?.products || [],
        skinTypes: skinTypeData.length > 0 ? skinTypeData : case_.customerInfo?.skinTypes || [],
        memo: case_.customerInfo?.memo || '',
        date: case_.createdAt ? case_.createdAt.split('T')[0] : '',
      };
    }

    return {
      ...case_,
      roundCustomerInfo,
      // 체크박스 데이터도 메타데이터에서 추출 (타입 안전)
      cureBooster: case_.cureBooster ?? (metadata as any).cureBooster ?? false,
      cureMask: case_.cureMask ?? (metadata as any).cureMask ?? false,
      premiumMask: case_.premiumMask ?? (metadata as any).premiumMask ?? false,
      allInOneSerum: case_.allInOneSerum ?? (metadata as any).allInOneSerum ?? false,
      skinRedSensitive: case_.skinRedSensitive ?? (metadata as any).skinRedSensitive ?? false,
      skinPigment: case_.skinPigment ?? (metadata as any).skinPigment ?? false,
      skinPore: case_.skinPore ?? (metadata as any).skinPore ?? false,
      skinTrouble: case_.skinTrouble ?? (metadata as any).skinTrouble ?? false,
      skinWrinkle: case_.skinWrinkle ?? (metadata as any).skinWrinkle ?? false,
      skinEtc: case_.skinEtc ?? (metadata as any).skinEtc ?? false,
    };
  });
}
