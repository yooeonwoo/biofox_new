import { useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toConvexId } from '@/lib/clinical-photos-mapper';
import type { ClinicalCase, RoundCustomerInfo } from '@/types/clinical';

/**
 * 케이스와 라운드 정보를 통합하는 커스텀 훅
 */
export function useCasesWithRoundInfo(cases: ClinicalCase[]) {
  // 각 케이스의 라운드 정보를 가져오기
  const roundInfoQueries = cases.map(case_ => ({
    caseId: case_.id,
    query: useQuery(api.clinical.getRoundCustomerInfo, { caseId: toConvexId(case_.id) }),
  }));

  // 케이스와 라운드 정보 통합
  const casesWithRoundInfo = useMemo(() => {
    return cases.map((case_, index) => {
      const roundInfoData = roundInfoQueries[index].query || [];

      // 라운드 정보를 UI 형식으로 변환
      const roundCustomerInfo: { [roundDay: number]: RoundCustomerInfo } = {};

      roundInfoData.forEach((round: any) => {
        roundCustomerInfo[round.round_number] = {
          age: round.age,
          gender: round.gender,
          treatmentType: round.treatment_type || '',
          products: round.products || [],
          skinTypes: round.skin_types || [],
          memo: round.memo || '',
          date: round.treatment_date || '',
        };
      });

      // 1라운드가 없으면 기본값으로 생성
      if (!roundCustomerInfo[1]) {
        // 메타데이터에서 체크박스 정보 추출
        const metadata = case_.metadata || {};
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
        cureBooster: case_.metadata?.cureBooster || false,
        cureMask: case_.metadata?.cureMask || false,
        premiumMask: case_.metadata?.premiumMask || false,
        allInOneSerum: case_.metadata?.allInOneSerum || false,
        skinRedSensitive: case_.metadata?.skinRedSensitive || false,
        skinPigment: case_.metadata?.skinPigment || false,
        skinPore: case_.metadata?.skinPore || false,
        skinTrouble: case_.metadata?.skinTrouble || false,
        skinWrinkle: case_.metadata?.skinWrinkle || false,
        skinEtc: case_.metadata?.skinEtc || false,
      };
    });
  }, [cases, roundInfoQueries]);

  return casesWithRoundInfo;
}
