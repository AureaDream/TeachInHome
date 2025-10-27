/**
 * 高德地图API工具类
 * 提供定位、距离计算等功能
 */

interface LocationInfo {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  district?: string;
}

interface DistanceResult {
  distance: number; // 距离（米）
  duration: number; // 时长（秒）
}

class AmapUtil {
  private static instance: AmapUtil;
  private readonly key: string = '0be843d17850558ea5d665ebce7a82ef';
  private readonly secret: string = '0cf3cc62122250c9d925ad3b7835f83e';
  private readonly baseUrl: string = 'https://restapi.amap.com/v3';

  private constructor() {}

  static getInstance(): AmapUtil {
    if (!AmapUtil.instance) {
      AmapUtil.instance = new AmapUtil();
    }
    return AmapUtil.instance;
  }

  /**
   * 获取用户当前位置
   * 优先使用微信定位，失败时使用高德IP定位
   */
  async getCurrentLocation(): Promise<LocationInfo> {
    try {
      // 首先尝试微信定位
      const wxLocation = await this.getWxLocation();
      if (wxLocation) {
        // 使用高德逆地理编码获取详细地址
        const addressInfo = await this.reverseGeocode(wxLocation.latitude, wxLocation.longitude);
        return {
          ...wxLocation,
          ...addressInfo
        };
      }
    } catch (error) {
      console.warn('微信定位失败:', error);
    }

    // 微信定位失败，使用高德IP定位
    try {
      return await this.getIpLocation();
    } catch (error) {
      console.error('IP定位失败:', error);
      throw new Error('定位失败，请检查网络连接或授权位置权限');
    }
  }

  /**
   * 微信定位
   */
  private getWxLocation(): Promise<LocationInfo> {
    return new Promise((resolve, reject) => {
      wx.getLocation({
        type: 'gcj02', // 高德地图坐标系
        success: (res) => {
          resolve({
            latitude: res.latitude,
            longitude: res.longitude
          });
        },
        fail: (error) => {
          reject(error);
        }
      });
    });
  }

  /**
   * IP定位（备用方案）
   */
  private async getIpLocation(): Promise<LocationInfo> {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${this.baseUrl}/ip`,
        data: {
          key: this.key,
          output: 'json'
        },
        success: (res: any) => {
          if (res.data.status === '1' && res.data.rectangle) {
            // 解析矩形范围，取中心点
            const rectangle = res.data.rectangle.split(';');
            const leftBottom = rectangle[0].split(',');
            const rightTop = rectangle[1].split(',');
            
            const longitude = (parseFloat(leftBottom[0]) + parseFloat(rightTop[0])) / 2;
            const latitude = (parseFloat(leftBottom[1]) + parseFloat(rightTop[1])) / 2;
            
            resolve({
              latitude,
              longitude,
              city: res.data.city,
              district: res.data.district,
              address: res.data.city + res.data.district
            });
          } else {
            reject(new Error(res.data.info || 'IP定位失败'));
          }
        },
        fail: (error) => {
          console.warn('IP定位网络请求失败，可能是域名未配置:', error);
          // 使用默认位置（福建师范大学）作为备用方案
          resolve({
            latitude: 26.03,
            longitude: 119.22,
            city: '福州市',
            district: '闽侯县',
            address: '福建师范大学'
          });
        }
      });
    });
  }

  /**
   * 逆地理编码 - 根据坐标获取地址信息
   */
  private async reverseGeocode(latitude: number, longitude: number): Promise<Partial<LocationInfo>> {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${this.baseUrl}/geocode/regeo`,
        data: {
          key: this.key,
          location: `${longitude},${latitude}`,
          output: 'json',
          radius: 1000,
          extensions: 'base'
        },
        success: (res: any) => {
          if (res.data.status === '1' && res.data.regeocode) {
            const regeocode = res.data.regeocode;
            const addressComponent = regeocode.addressComponent;
            
            resolve({
              address: regeocode.formatted_address,
              city: addressComponent.city,
              district: addressComponent.district
            });
          } else {
            resolve({}); // 逆地理编码失败不影响定位结果
          }
        },
        fail: () => {
          resolve({}); // 逆地理编码失败不影响定位结果
        }
      });
    });
  }

  /**
   * 计算两点间距离
   * @param origin 起点坐标
   * @param destination 终点坐标
   * @returns 距离信息
   */
  async calculateDistance(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number }
  ): Promise<DistanceResult> {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${this.baseUrl}/distance`,
        data: {
          key: this.key,
          origins: `${origin.longitude},${origin.latitude}`,
          destination: `${destination.longitude},${destination.latitude}`,
          type: 1, // 直线距离
          output: 'json'
        },
        success: (res: any) => {
          if (res.data.status === '1' && res.data.results && res.data.results.length > 0) {
            const result = res.data.results[0];
            resolve({
              distance: parseInt(result.distance),
              duration: parseInt(result.duration || 0)
            });
          } else {
            reject(new Error(res.data.info || '距离计算失败'));
          }
        },
        fail: (error) => {
          reject(error);
        }
      });
    });
  }

  /**
   * 批量计算距离
   * @param userLocation 用户位置
   * @param locations 目标位置列表
   * @returns 距离列表
   */
  async batchCalculateDistance(
    userLocation: { latitude: number; longitude: number },
    locations: Array<{ latitude: number; longitude: number; id: string }>
  ): Promise<Array<{ id: string; distance: number; duration: number }>> {
    const results = [];
    
    // 分批处理，每批最多20个点（高德API限制）
    const batchSize = 20;
    for (let i = 0; i < locations.length; i += batchSize) {
      const batch = locations.slice(i, i + batchSize);
      const batchResults = await this.processBatch(userLocation, batch);
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * 处理单批距离计算
   */
  private async processBatch(
    userLocation: { latitude: number; longitude: number },
    locations: Array<{ latitude: number; longitude: number; id: string }>
  ): Promise<Array<{ id: string; distance: number; duration: number }>> {
    return new Promise((resolve, reject) => {
      const destinations = locations.map(loc => `${loc.longitude},${loc.latitude}`).join('|');
      
      wx.request({
        url: `${this.baseUrl}/distance`,
        data: {
          key: this.key,
          origins: `${userLocation.longitude},${userLocation.latitude}`,
          destination: destinations,
          type: 1,
          output: 'json'
        },
        success: (res: any) => {
          if (res.data.status === '1' && res.data.results) {
            const results = res.data.results.map((result: any, index: number) => ({
              id: locations[index].id,
              distance: parseInt(result.distance),
              duration: parseInt(result.duration || 0)
            }));
            resolve(results);
          } else {
            reject(new Error(res.data.info || '批量距离计算失败'));
          }
        },
        fail: (error) => {
          reject(error);
        }
      });
    });
  }

  /**
   * 格式化距离显示
   * @param distance 距离（米）
   * @returns 格式化后的距离字符串
   */
  formatDistance(distance: number): string {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    } else if (distance < 10000) {
      return `${(distance / 1000).toFixed(1)}km`;
    } else {
      return `${Math.round(distance / 1000)}km`;
    }
  }

  /**
   * 根据距离筛选条件过滤订单
   * @param orders 订单列表
   * @param userLocation 用户位置
   * @param distanceFilter 距离筛选条件
   * @returns 过滤后的订单列表
   */
  async filterOrdersByDistance(
    orders: any[],
    userLocation: { latitude: number; longitude: number },
    distanceFilter: string
  ): Promise<any[]> {
    if (!distanceFilter || distanceFilter === '不限') {
      return orders;
    }

    // 解析距离筛选条件
    const maxDistance = this.parseDistanceFilter(distanceFilter);
    if (maxDistance === -1) {
      return orders;
    }

    // 过滤有坐标信息的订单
    const ordersWithLocation = orders.filter(order => 
      order.latitude && order.longitude && 
      !isNaN(order.latitude) && !isNaN(order.longitude)
    );

    if (ordersWithLocation.length === 0) {
      return orders; // 如果没有订单有位置信息，返回原列表
    }

    try {
      // 批量计算距离
      const locations = ordersWithLocation.map(order => ({
        id: order._id,
        latitude: order.latitude,
        longitude: order.longitude
      }));

      const distanceResults = await this.batchCalculateDistance(userLocation, locations);
      
      // 创建距离映射
      const distanceMap = new Map();
      distanceResults.forEach(result => {
        distanceMap.set(result.id, result.distance);
      });

      // 过滤订单并添加距离信息
      return orders.filter(order => {
        if (!order.latitude || !order.longitude) {
          return true; // 没有位置信息的订单保留
        }
        
        const distance = distanceMap.get(order._id);
        if (distance !== undefined) {
          order.distance = distance;
          order.distanceText = this.formatDistance(distance);
          return distance <= maxDistance;
        }
        
        return true;
      });
    } catch (error) {
      console.error('距离筛选失败:', error);
      return orders; // 筛选失败时返回原列表
    }
  }

  /**
   * 解析距离筛选条件
   * @param distanceFilter 距离筛选字符串
   * @returns 最大距离（米），-1表示解析失败
   */
  private parseDistanceFilter(distanceFilter: string): number {
    const distanceMap: { [key: string]: number } = {
      '1公里内': 1000,
      '3公里内': 3000,
      '5公里内': 5000,
      '10公里内': 10000,
      '不限': -1
    };

    return distanceMap[distanceFilter] || -1;
  }
}

export default AmapUtil;