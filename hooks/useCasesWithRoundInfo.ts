import { useMemo } from 'react';
import type { ClinicalCase, RoundCustomerInfo } from '@/types/clinical';

/**
 * 케이스와 라운드 정보를 통합하는 함수 (훅이 아닌 일반 함수)
 * 라운드 정보는 케이스 데이터 내의 metadata에서 추출
 */
export function enrichCasesWithRoundInfo(cases: ClinicalCase[]): ClinicalCase[] {
  return cases.map(case_ => {
    // 라운드 정보를 메타데이터에서 추출
    const metadata = (case_.metadata as any) || {};
    const roundInfoFromMetadata = metadata.roundInfo || {};
    const roundCustomerInfo: { [roundDay: number]: RoundCustomerInfo } = {};

    // 저장된 라운드 정보가 있으면 사용
    if (Object.keys(roundInfoFromMetadata).length > 0) {
      for (const [roundNumber, info] of Object.entries(roundInfoFromMetadata)) {
        const roundData = info as any;
        roundCustomerInfo[parseInt(roundNumber)] = {
          age: roundData.age,
          gender: roundData.gender,
          treatmentType: roundData.treatmentType || '',
          products: roundData.products || [],
          skinTypes: roundData.skinTypes || [],
          memo: roundData.memo || '',
          date: roundData.treatmentDate || '',
        };
      }
    }

    // 1라운드가 없으면 기본값으로 생성
    if (!roundCustomerInfo[1]) {
      // 메타데이터에서 체크박스 정보 추출
      const productTypes = [];
      if (metadata.cureBooster) productTypes.push('cure_booster');
      if (metadata.cureMask) productTypes.push('cure_mask');
      if (metadata.premiumMask) productTypes.push('premium_mask');
      if (metadata.allInOneSerum) productTypes.push('all_in_one_serum');

      const skinTypeData = [];
      if (metadata.skinRedSensitive) skinTypeData.push('red_sensitive');
      if (metadata.skinPigment) skinTypeData.push('pigment');
      if (metadata.skinPore) skinTypeData.push('pore');
      if (metadata.skinTrouble) skinTypeData.push('acne_trouble');
      if (metadata.skinWrinkle) skinTypeData.push('wrinkle');
      if (metadata.skinEtc) skinTypeData.push('other');

      roundCustomerInfo[1] = {
        age: case_.customerInfo?.age,
        gender: case_.customerInfo?.gender,
        treatmentType: '',
        products: productTypes,
        skinTypes: skinTypeData,
        memo: case_.treatmentPlan || '',
        date: case_.createdAt,
      };
    }

    return {
      ...case_,
      roundCustomerInfo,
      // 체크박스 데이터도 메타데이터에서 추출
      cureBooster: metadata.cureBooster || false,
      cureMask: metadata.cureMask || false,
      premiumMask: metadata.premiumMask || false,
      allInOneSerum: metadata.allInOneSerum || false,
      skinRedSensitive: metadata.skinRedSensitive || false,
      skinPigment: metadata.skinPigment || false,
      skinPore: metadata.skinPore || false,
      skinTrouble: metadata.skinTrouble || false,
      skinWrinkle: metadata.skinWrinkle || false,
      skinEtc: metadata.skinEtc || false,
    };
  });
}
