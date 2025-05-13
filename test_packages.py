#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
패키지 설치 테스트 스크립트
"""

print("====== 파이썬 환경 테스트 ======")

# 시스템 정보
import sys
print(f"파이썬 버전: {sys.version}")
print(f"파이썬 경로: {sys.executable}")
print("\n")

# 데이터 분석 패키지
print("====== 데이터 분석 패키지 테스트 ======")
import numpy as np
print(f"NumPy 버전: {np.__version__}")
array = np.array([1, 2, 3, 4, 5])
print(f"NumPy 배열: {array}")

import pandas as pd
print(f"Pandas 버전: {pd.__version__}")
df = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6]})
print("Pandas DataFrame:")
print(df)

import matplotlib
print(f"Matplotlib 버전: {matplotlib.__version__}")
print("Matplotlib 가져오기 성공")
print("\n")

# 웹 개발 패키지
print("====== 웹 개발 패키지 테스트 ======")
import requests
print(f"Requests 버전: {requests.__version__}")

import flask
print(f"Flask 버전: {flask.__version__}")

import fastapi
print(f"FastAPI 버전: {fastapi.__version__}")
print("\n")

# 기계학습 패키지
print("====== 기계학습 패키지 테스트 ======")
import sklearn
print(f"Scikit-learn 버전: {sklearn.__version__}")

try:
    import torch
    print(f"PyTorch 버전: {torch.__version__}")
    print(f"PyTorch CUDA 사용 가능: {torch.cuda.is_available()}")
except ImportError:
    print("PyTorch가 설치되지 않았습니다.")

print("\n====== 모든 패키지 테스트 완료 ======")