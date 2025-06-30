// Supabase 데이터베이스 타입 정의
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: number
          clerk_id: string
          email: string
          name: string | null
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          clerk_id: string
          email: string
          name?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          clerk_id?: string
          email?: string
          name?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
      kols: {
        Row: {
          id: number
          user_id: number
          name: string
          shop_name: string
          region: string | null
          smart_place_link: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: number
          name: string
          shop_name: string
          region?: string | null
          smart_place_link?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: number
          name?: string
          shop_name?: string
          region?: string | null
          smart_place_link?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      shops: {
        Row: {
          id: number
          owner_name: string
          shop_name: string
          kol_id: number
          region: string | null
          smart_place_link: string | null
          is_owner_kol: boolean
          contract_date: string | null
          email: string | null
          owner_kol_id: number | null
          is_self_shop: boolean
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          owner_name: string
          shop_name: string
          kol_id: number
          region?: string | null
          smart_place_link?: string | null
          is_owner_kol?: boolean
          contract_date?: string | null
          email?: string | null
          owner_kol_id?: number | null
          is_self_shop?: boolean
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          owner_name?: string
          shop_name?: string
          kol_id?: number
          region?: string | null
          smart_place_link?: string | null
          is_owner_kol?: boolean
          contract_date?: string | null
          email?: string | null
          owner_kol_id?: number | null
          is_self_shop?: boolean
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: number
          name: string
          price: number
          is_device: boolean
          description: string | null
          image: string | null
          category: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          price: number
          is_device?: boolean
          description?: string | null
          image?: string | null
          category?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          price?: number
          is_device?: boolean
          description?: string | null
          image?: string | null
          category?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: number
          user_id: number
          title: string
          content: string
          read: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: number
          title: string
          content: string
          read?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: number
          title?: string
          content?: string
          read?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      sales_activities: {
        Row: {
          id: number
          kol_id: number
          shop_id: number | null
          activity_date: string
          content: string
          activity_type: 'general' | 'visit' | null
          shop_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          kol_id: number
          shop_id?: number | null
          activity_date?: string
          content: string
          activity_type?: 'general' | 'visit' | null
          shop_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          kol_id?: number
          shop_id?: number | null
          activity_date?: string
          content?: string
          activity_type?: 'general' | 'visit' | null
          shop_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      kol_dashboard_metrics: {
        Row: {
          id: number
          kol_id: number
          year_month: string
          monthly_sales: number
          monthly_commission: number
          active_shops_count: number
          total_shops_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          kol_id: number
          year_month: string
          monthly_sales?: number
          monthly_commission?: number
          active_shops_count?: number
          total_shops_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          kol_id?: number
          year_month?: string
          monthly_sales?: number
          monthly_commission?: number
          active_shops_count?: number
          total_shops_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      shop_sales_metrics: {
        Row: {
          id: number
          shop_id: number
          year_month: string
          total_sales: number
          product_sales: number
          device_sales: number
          commission: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          shop_id: number
          year_month: string
          total_sales?: number
          product_sales?: number
          device_sales?: number
          commission?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          shop_id?: number
          year_month?: string
          total_sales?: number
          product_sales?: number
          device_sales?: number
          commission?: number
          created_at?: string
          updated_at?: string
        }
      }
      kol_total_monthly_sales: {
        Row: {
          id: number
          kol_id: number
          year_month: string
          total_sales: number
          product_sales: number
          device_sales: number
          total_commission: number
          total_active_shops: number
          total_shops: number
          direct_sales_ratio: number
          indirect_sales_ratio: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          kol_id: number
          year_month: string
          total_sales?: number
          product_sales?: number
          device_sales?: number
          total_commission?: number
          total_active_shops?: number
          total_shops?: number
          direct_sales_ratio?: number
          indirect_sales_ratio?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          kol_id?: number
          year_month?: string
          total_sales?: number
          product_sales?: number
          device_sales?: number
          total_commission?: number
          total_active_shops?: number
          total_shops?: number
          direct_sales_ratio?: number
          indirect_sales_ratio?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    // 복잡한 쿼리 결과에 대한 타입 정의
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}

// 애플리케이션에서 사용할 타입 정의
export type User = Database['public']['Tables']['users']['Row']
export type Kol = Database['public']['Tables']['kols']['Row']
export type Shop = Database['public']['Tables']['shops']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type SalesActivity = Database['public']['Tables']['sales_activities']['Row']
export type KolDashboardMetric = Database['public']['Tables']['kol_dashboard_metrics']['Row']
export type ShopSalesMetric = Database['public']['Tables']['shop_sales_metrics']['Row']
export type KolTotalMonthlySale = Database['public']['Tables']['kol_total_monthly_sales']['Row']

// 카멜케이스로 변환된 타입 (프론트엔드에서 사용)
export type UserCamel = {
  id: number
  clerkId: string
  email: string
  name: string | null
  role: string
  createdAt: string
  updatedAt: string
}

export type KolCamel = {
  id: number
  userId: number
  name: string
  shopName: string
  region: string | null
  smartPlaceLink: string | null
  status: string
  createdAt: string
  updatedAt: string
}

export type ShopCamel = {
  id: number
  ownerName: string
  shopName: string
  kolId: number
  region: string | null
  smartPlaceLink: string | null
  isOwnerKol: boolean
  contractDate: string | null
  email: string | null
  ownerKolId: number | null
  isSelfShop: boolean
  status: string
  createdAt: string
  updatedAt: string
}



export type KolDashboardMetricCamel = {
  id: number
  kolId: number
  yearMonth: string
  monthlySales: number
  monthlyCommission: number
  activeShopsCount: number
  totalShopsCount: number
  createdAt: string
  updatedAt: string
}

export type ShopSalesMetricCamel = {
  id: number
  shopId: number
  yearMonth: string
  totalSales: number
  productSales: number
  deviceSales: number
  commission: number
  createdAt: string
  updatedAt: string
}


// 대시보드 데이터 타입 (kol-new 페이지에서 사용)
export type DashboardData = {
  kol: {
    id: number
    name: string
    shopName: string
  }
  sales: {
    currentMonth: number
    previousMonth: number
    growth: number
  }
  allowance: {
    currentMonth: number
    previousMonth: number
    growth: number
  }
  shops: {
    total: number
    ordering: number
    notOrdering: number
    lastAddedDate?: string
  }
} 