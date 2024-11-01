import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Table, Spin, Input, Select, message } from 'antd';
import { UbikeStation } from './types';

const { Search } = Input;
const { Option } = Select;

const UbikeTable: React.FC = () => {
  const [ubikeData, setUbikeData] = useState<UbikeStation[]>([]);
  const [filteredData, setFilteredData] = useState<UbikeStation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [searchText, setSearchText] = useState<string>('');

  const formatDateTime = (dateTimeString: string): string => {
    if (!dateTimeString) return '未知時間';
  
    const date = new Date(dateTimeString);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    };
  
    return date.toLocaleString('zh-TW', options).replace(',', ' ');
  };


  const fetchUbikeData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('https://tcgbusfs.blob.core.windows.net/dotapp/youbike/v2/youbike_immediate.json');
      const data: UbikeStation[] = response.data.map((item: any) => ({
        sno: item.sno,
        sna: item.sna,
        sarea: item.sarea,
        ar: item.ar,
        available_rent_bikes: Number(item.available_rent_bikes),
        available_return_bikes: Number(item.available_return_bikes),
        total: Number(item.total), 
        updateTime: item.mday,
      }));

      setUbikeData(data);
      setFilteredData(data);
    } catch (error) {
      console.error(error);
      message.error('無法取得 YouBike 資訊，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'YouBike 站點資訊';
    fetchUbikeData();
    const interval = setInterval(fetchUbikeData, 60000); 
    return () => clearInterval(interval);
  }, []);

  // 處理行政區篩選
  const handleAreaFilter = (value: string | null) => {
    setSelectedArea(value);
    applyFilters(value, searchText);
  };

  // 處理搜尋
  const handleSearch = (value: string) => {
    setSearchText(value);
    applyFilters(selectedArea, value);
  };

  // 根據行政區和搜尋文字應用篩選
  const applyFilters = (area: string | null, text: string) => {
    let filtered = ubikeData;
    if (area) {
      filtered = filtered.filter((item) => item.sarea === area);
    }
    if (text) {
      filtered = filtered.filter((item) =>
        item.sna.toLowerCase().includes(text.toLowerCase())
      );
    }
    setFilteredData(filtered);
  };

  // 定義表格欄位
  const columns = [
    {
      title: '站點編號',
      dataIndex: 'sno',
      key: 'sno',
    },
    {
      title: '站點名稱',
      dataIndex: 'sna',
      key: 'sna',
    },
    {
      title: '行政區',
      dataIndex: 'sarea',
      key: 'sarea',
    },
    {
      title: '地址',
      dataIndex: 'ar',
      key: 'ar',
    },
    {
      title: '可租借車輛數',
      dataIndex: 'available_rent_bikes',
      key: 'available_rent_bikes',
      sorter: (a: UbikeStation, b: UbikeStation) => a.available_rent_bikes - b.available_rent_bikes,
    },
    {
      title: '可歸還空位數',
      dataIndex: 'available_return_bikes',
      key: 'available_return_bikes',
      sorter: (a: UbikeStation, b: UbikeStation) => a.available_return_bikes - b.available_return_bikes,
    },
    {
      title: '總車輛數',
      dataIndex: 'total',
      key: 'total',
    },
    {
      title: '更新時間',
      dataIndex: 'updateTime',
      key: 'updateTime',
      render: (text: string) => formatDateTime(text),
    },
  ];

  // 提取獨特的行政區名稱以用於篩選下拉選單
  const areaOptions = [...new Set(ubikeData.map((item) => item.sarea))];

  return (
    <div style={{ padding: '20px' }}>
      <h1>YouBike 站點資訊</h1>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        {/* 行政區篩選 */}
        <Select
          placeholder="選擇行政區"
          onChange={handleAreaFilter}
          allowClear
          style={{ width: 200 }}
        >
          {areaOptions.map((area) => (
            <Option key={area} value={area}>
              {area}
            </Option>
          ))}
        </Select>
        {/* 搜尋欄 */}
        <Search
          placeholder="搜尋站點名稱"
          onSearch={handleSearch}
          enterButton
          style={{ width: 300 }}
        />
      </div>
      {loading ? (
        <Spin tip="資料加載中..." />
      ) : (
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="sno"
          pagination={{ pageSize: 10 }}
        />
      )}
    </div>
  );
};

export default UbikeTable;
