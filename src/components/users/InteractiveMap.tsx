import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { MapPin, Search, Layers, RefreshCw, Eye, EyeOff, Radio } from 'lucide-react';
import { userService, Territory, UserDetail } from '@/src/services/userService';

interface InteractiveMapProps {
  focusedTerritoryId?: string;
  onSelectTerritory?: (id: string) => void;
}

// Coordinate mappings for Tuyên Quang towns/communes
const COORDINATE_MAP: Record<string, [number, number]> = {
  "Phường Minh Xuân": [21.8193, 105.2132],
  "Xã Hùng Đức": [21.9213, 105.1523],
  "Phường Phan Thiết": [21.8122, 105.2115],
  "Phường Tân Quang": [21.8256, 105.2167],
  "Xã Lưỡng Vượng": [21.7895, 105.2341],
  "Xã An Khang": [21.7654, 105.2512],
  "Xã Nông Tiến": [21.8322, 105.2289],
  "Xã Tràng Đà": [21.8598, 105.2144]
};

const getCoordinatesForTerritory = (name: string, index: number): [number, number] => {
  const match = Object.keys(COORDINATE_MAP).find(
    k => name.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(name.toLowerCase())
  );
  if (match) {
    return COORDINATE_MAP[match];
  }
  
  // Deterministic hash based offset around Center of Tuyên Quang
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const latOffset = ((Math.abs(hash) % 150) - 75) / 1000; // ±0.075
  const lngOffset = (((Math.abs(hash) >> 8) % 150) - 75) / 1000; // ±0.075
  return [21.821032 + latOffset, 105.216654 + lngOffset];
};

type MapStyle = 'street' | 'satellite' | 'dark';

export default function InteractiveMap({ focusedTerritoryId, onSelectTerritory }: InteractiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const staffMarkersRef = useRef<Record<string, any>>({});
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapStyle, setMapStyle] = useState<MapStyle>('street');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showStaff, setShowStaff] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSimulating, setIsSimulating] = useState(true);
  
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [currentCoords, setCurrentCoords] = useState<[number, number]>([21.821032, 105.216654]);

  // Load data
  useEffect(() => {
    const load = () => {
      setTerritories(userService.getTerritories());
      setUsers(userService.getUsers());
    };
    load();
    const unsubscribe = userService.subscribe(load);
    return () => unsubscribe();
  }, []);

  // Inject Leaflet Assets Dynamically
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Inject CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Inject JS
    const loadScript = () => {
      if ((window as any).L) {
        setMapLoaded(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => setMapLoaded(true);
      document.body.appendChild(script);
    };

    loadScript();
  }, []);

  // Initialize Map Instance
  useEffect(() => {
    if (!mapLoaded || !containerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    if (containerRef.current) {
      const anyEl = containerRef.current as any;
      if (anyEl._leaflet_id) {
        anyEl._leaflet_id = null;
      }
    }

    // 1. Create Map
    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([21.821032, 105.216654], 13);
    
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Track center hovered coords
    map.on('mousemove', (e: any) => {
      setCurrentCoords([e.latlng.lat, e.latlng.lng]);
    });

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.off();
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapLoaded]);

  // Update Tile Layers Setup on mapStyle changes
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;
    const L = (window as any).L;
    const map = mapInstanceRef.current;

    const tileUrls = {
      street: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    };

    // Clear existing tile layers
    map.eachLayer((layer: any) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    // Add selected Base Layer
    L.tileLayer(tileUrls[mapStyle]).addTo(map);
  }, [mapLoaded, mapStyle]);

  // Render & Update Markers / Pins inside territories
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;
    const L = (window as any).L;
    const map = mapInstanceRef.current;

    // Remove old territory markers
    Object.values(markersRef.current).forEach((marker: any) => map.removeLayer(marker));
    markersRef.current = {};

    // Remove old heatmap overlays
    map.eachLayer((layer: any) => {
      if (layer instanceof L.Circle && layer.options?.pane === 'overlayPane' && !layer.options?.isStaffCircle) {
        map.removeLayer(layer);
      }
    });

    // Draw active territories
    territories.forEach((t, i) => {
      const coords = getCoordinatesForTerritory(t.name, i);
      const isFocused = t.id === focusedTerritoryId;
      const staffAssigned = users.find(u => u.id === t.staffId);

      // Distinct visual indicator depending on status
      const colorBg = isFocused 
        ? 'bg-amber-500 hover:bg-amber-600 scale-125 ring-4 ring-amber-500/30' 
        : t.staffId 
          ? 'bg-[#005BAA] hover:bg-blue-700' 
          : 'bg-red-500 hover:bg-red-600 animate-pulse';

      // Create high-craft Custom Div Icon
      const customIcon = L.divIcon({
        html: `<div class="w-8 h-8 rounded-full ${colorBg} border-2 border-white flex items-center justify-center shadow-lg transition-transform duration-200 cursor-pointer">
                 <span class="text-white text-[9px] font-black leading-none">${t.count ? Math.round(parseFloat(t.count)) : '0'}</span>
               </div>`,
        className: 'custom-div-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
      });

      const popupContent = `
        <div class="font-sans p-1 text-slate-800">
          <div class="font-black text-xs uppercase tracking-tight text-[#005BAA] mb-1">${t.name}</div>
          <div class="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Đơn vị: VNPT Hàm Yên</div>
          <hr class="border-slate-100 my-1.5" />
          <div class="flex flex-col gap-1 text-[11px]">
            <div><b class="text-slate-600">Khách hàng:</b> <span class="font-mono font-bold text-slate-900">${t.count}</span> KH</div>
            <div><b class="text-slate-600">Phụ trách:</b> <span class="font-bold uppercase text-brand-orange">${staffAssigned ? staffAssigned.name : 'Chưa phân công'}</span></div>
            <div><b class="text-slate-600">Mã địa bàn:</b> <span class="font-mono text-xs font-bold text-slate-500">TERR-${t.id.slice(0, 4)}</span></div>
          </div>
        </div>
      `;

      const marker = L.marker(coords, { icon: customIcon })
        .addTo(map)
        .bindPopup(popupContent);

      marker.on('click', () => {
        if (onSelectTerritory) {
          onSelectTerritory(t.id);
        }
      });

      markersRef.current[t.id] = marker;

      // Draw client concentration circle overlay (Heatmap visualizer)
      if (showHeatmap) {
        const radius = Math.min(1000, Math.max(200, parseFloat(t.count || '500') / 2));
        L.circle(coords, {
          color: isFocused ? '#f59e0b' : t.staffId ? '#3b82f6' : '#ef4444',
          fillColor: isFocused ? '#f59e0b' : t.staffId ? '#3b82f6' : '#ef4444',
          fillOpacity: 0.15,
          radius: radius,
          weight: 1,
          isStaffCircle: false
        }).addTo(map);
      }
    });

  }, [mapLoaded, territories, focusedTerritoryId, showHeatmap, users]);

  // Simulate & Draw Real-time Active Staff Locators on the Map
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;
    const L = (window as any).L;
    const map = mapInstanceRef.current;

    // Clear old active staff pointers
    Object.values(staffMarkersRef.current).forEach((marker: any) => map.removeLayer(marker));
    staffMarkersRef.current = {};

    map.eachLayer((layer: any) => {
      if (layer instanceof L.Circle && layer.options?.isStaffCircle) {
        map.removeLayer(layer);
      }
    });

    if (!showStaff) return;

    // Display Active Staff on Map around the districts
    users.filter(u => u.status === 'ACTIVE').forEach((user, i) => {
      // Find user-assigned territory center or calculate offset
      const assignedTerritory = territories.find(t => t.staffId === user.id);
      let baseCoords: [number, number] = [21.821032, 105.216654];
      if (assignedTerritory) {
        baseCoords = getCoordinatesForTerritory(assignedTerritory.name, i);
      } else {
        // Offset center deterministic
        baseCoords = [
          21.821032 + (Math.sin(i) * 0.015),
          105.216654 + (Math.cos(i) * 0.015)
        ];
      }

      // Live animated offset if Simulating is active
      const simulatedCoords: [number, number] = isSimulating 
        ? [baseCoords[0] + (Math.sin(Date.now() / 4000 + i) * 0.0008), baseCoords[1] + (Math.cos(Date.now() / 4000 + i) * 0.0008)]
        : baseCoords;

      // Generate Staff avatar placeholder marker with directional/radar wave
      const staffColor = user.role.includes('Quản lý') ? 'bg-[#005BAA]' : 'bg-emerald-500';

      const staffIcon = L.divIcon({
        html: `<div class="relative flex items-center justify-center">
                 <div class="absolute w-6 h-6 rounded-full ${staffColor} opacity-35 animate-ping"></div>
                 <div class="w-7 h-7 rounded-full bg-white border-2 border-emerald-400 shadow-xl flex items-center justify-center text-[8px] font-black text-slate-800 tracking-tighter uppercase overflow-hidden">
                   ${user.name.split(' ').pop()?.slice(0, 2)}
                 </div>
                 <div class="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border border-white bg-blue-500"></div>
               </div>`,
        className: 'custom-staff-icon',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const staffPopup = `
        <div class="font-sans px-1 py-0.5">
          <div class="flex items-center gap-2 mb-1">
            <span class="w-2 h-2 rounded-full bg-blue-500"></span>
            <span class="font-black text-xs text-slate-800 uppercase">${user.name}</span>
          </div>
          <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">${user.role} | ${user.code}</p>
          <hr class="border-slate-100 my-1" />
          <div class="space-y-0.5 text-[10px] text-slate-600 font-medium">
            <div><b>Tuyến kinh doanh:</b> ${assignedTerritory ? assignedTerritory.name : 'Không cố định'}</div>
            <div><b>KPI đợt:</b> <span class="font-bold text-slate-900">${user.progress}%</span> hoàn thành</div>
            <div><b>Điện thoại:</b> <span class="font-mono text-slate-800 font-bold">${user.phone}</span></div>
          </div>
        </div>
      `;

      const marker = L.marker(simulatedCoords, { icon: staffIcon })
        .addTo(map)
        .bindPopup(staffPopup);

      staffMarkersRef.current[user.id] = marker;

      // Pulse coverage radius indicator circle
      L.circle(simulatedCoords, {
        color: '#10b981',
        fillColor: '#10b981',
        fillOpacity: 0.05,
        radius: 350,
        weight: 1,
        dashArray: '3, 5',
        isStaffCircle: true
      }).addTo(map);
    });

  }, [mapLoaded, users, territories, showStaff, isSimulating]);

  // Hook simulated movements interval
  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(() => {
      // Trigger a re-render for coordinate simulation offset ticking
      setUsers(prev => [...prev]);
    }, 4000);
    return () => clearInterval(interval);
  }, [isSimulating]);

  // Handle zooming/centering to focused territory from parent row selection
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded || !focusedTerritoryId) return;
    const activeIndex = territories.findIndex(t => t.id === focusedTerritoryId);
    if (activeIndex === -1) return;

    const name = territories[activeIndex].name;
    const coords = getCoordinatesForTerritory(name, activeIndex);
    
    // Zoom in smoothly
    mapInstanceRef.current.setView(coords, 14, { animate: true, duration: 1.2 });

    // Open target popup automatically with timer delay to allow animation
    setTimeout(() => {
      const marker = markersRef.current[focusedTerritoryId];
      if (marker) {
        marker.openPopup();
      }
    }, 800);
  }, [focusedTerritoryId, mapLoaded, territories]);

  // Handle active Search bar query maps locator
  const handleMapSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery || !mapInstanceRef.current) return;

    const lower = searchQuery.toLowerCase();
    const activeIdx = territories.findIndex(t => t.name.toLowerCase().includes(lower));
    if (activeIdx !== -1) {
      const t = territories[activeIdx];
      const coords = getCoordinatesForTerritory(t.name, activeIdx);
      mapInstanceRef.current.setView(coords, 14, { animate: true });
      setTimeout(() => {
        const marker = markersRef.current[t.id];
        if (marker) marker.openPopup();
      }, 500);
    } else {
      // Find users active
      const activeUser = users.find(u => u.name.toLowerCase().includes(lower));
      if (activeUser) {
        const marker = staffMarkersRef.current[activeUser.id];
        if (marker) {
          mapInstanceRef.current.setView(marker.getLatLng(), 15, { animate: true });
          setTimeout(() => marker.openPopup(), 500);
        }
      } else {
        // Expand search via OpenStreetMap Nominatim API for general addresses / locations
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
          const data = await response.json();
          if (data && data.length > 0) {
            const loc = data[0];
            const lat = parseFloat(loc.lat);
            const lng = parseFloat(loc.lon);
            const map = mapInstanceRef.current;
            map.setView([lat, lng], 15, { animate: true });
            
            const L = (window as any).L;
            if ((window as any).searchMarker) {
               map.removeLayer((window as any).searchMarker);
            }
            // Add a pinpoint for the found device/location
            const pinIcon = L.divIcon({
               html: `<div class="w-10 h-10 -mt-10 -ml-5 flex flex-col items-center justify-center animate-bounce">
                        <div class="bg-red-500 rounded-full p-1.5 shadow-xl border-2 border-white">
                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        </div>
                        <div class="w-1.5 h-1.5 bg-red-600 rounded-full mt-1"></div>
                      </div>`,
               className: 'search-pin-icon'
            });
            
            const marker = L.marker([lat, lng], { icon: pinIcon })
              .addTo(map)
              .bindPopup(`
                <div class="font-sans text-xs p-1">
                  <div class="text-red-500 font-bold uppercase mb-1">Vị trí tìm thấy</div>
                  <div class="text-slate-700">${loc.display_name}</div>
                </div>
              `);
            (window as any).searchMarker = marker;
            setTimeout(() => marker.openPopup(), 600);
          } else {
            console.log("No location found");
          }
        } catch (err) {
          console.error("Geocoding failed:", err);
        }
      }
    }
  };

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([21.821032, 105.216654], 13, { animate: true });
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm p-4 bg-white overflow-hidden relative flex flex-col h-[520px]">
      {/* Dynamic Header Controls */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-brand-orange animate-pulse" />
            Giám sát kỹ thuật viễn thông bản đồ
          </h4>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
            Tỉnh Tuyên Quang: <span className="font-mono text-xs">{currentCoords[0].toFixed(5)}, {currentCoords[1].toFixed(5)}</span>
          </p>
        </div>
        
        {/* Quick Style Picker */}
        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/50">
          <button 
            onClick={() => setMapStyle('street')}
            className={`px-2 py-1 text-[9px] font-black uppercase rounded ${mapStyle === 'street' ? 'bg-white text-[#005BAA] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Đường sắc
          </button>
          <button 
            onClick={() => setMapStyle('satellite')}
            className={`px-2 py-1 text-[9px] font-black uppercase rounded ${mapStyle === 'satellite' ? 'bg-white text-[#005BAA] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Vệ tinh
          </button>
          <button 
            onClick={() => setMapStyle('dark')}
            className={`px-2 py-1 text-[9px] font-black uppercase rounded ${mapStyle === 'dark' ? 'bg-white text-[#005BAA] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Nền tối
          </button>
        </div>
      </div>

      {/* Floating search map bar */}
      <form onSubmit={handleMapSearch} className="absolute left-4 right-4 sm:right-auto sm:left-8 top-20 sm:top-18 z-[999] sm:w-72 flex gap-1 bg-white p-1 rounded-full shadow-lg border border-slate-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <Input 
            placeholder="Tìm địa bàn, phường xã..." 
            className="pl-8 bg-transparent border-none text-[10px] h-7 font-sans focus-visible:ring-0 shadow-none text-slate-700"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button size="sm" type="submit" className="h-7 rounded-full bg-[#005BAA] hover:bg-blue-700 text-white font-bold text-[9px] px-3 uppercase">Tìm</Button>
      </form>

      {/* Floating layer controls toggler */}
      <div className="absolute right-4 sm:right-8 top-32 sm:top-18 z-[999] flex flex-col gap-1">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRecenter}
          className="h-8 w-8 rounded-xl bg-white hover:bg-slate-50 border-slate-200 text-slate-600 shadow-md p-0 flex items-center justify-center"
          title="Recenter Map"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`h-8 w-8 rounded-xl border-slate-200 shadow-md p-0 flex items-center justify-center ${showHeatmap ? 'bg-amber-50 text-amber-500 hover:bg-amber-100' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          title="Bật/Tắt Nhiệt độ KH"
        >
          <Layers className="w-3.5 h-3.5" />
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowStaff(!showStaff)}
          className={`h-8 w-8 rounded-xl border-slate-200 shadow-md p-0 flex items-center justify-center ${showStaff ? 'bg-emerald-50 text-emerald-500 hover:bg-emerald-100' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          title="Ẩn/Hiện Nhân viên Realtime"
        >
          {showStaff ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setIsSimulating(!isSimulating)}
          className={`h-8 w-8 rounded-xl border-slate-200 shadow-md p-0 flex items-center justify-center ${isSimulating ? 'bg-orange-50 text-orange-500 hover:bg-orange-100 border-orange-200/50' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          title="Bật/Tắt Mô phỏng di chuyển"
        >
          <Radio className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Map Node */}
      <div className="flex-1 w-full bg-slate-50 rounded-2xl relative border border-slate-200/50 overflow-hidden shadow-inner flex items-center justify-center">
        {!mapLoaded && (
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-[#005BAA] animate-spin mx-auto mb-3" />
            <p className="text-xs font-black uppercase text-brand-orange tracking-tight">Vị trí nhân sự Realtime</p>
            <p className="text-[9px] text-brand-indigo font-black uppercase tracking-widest mt-1">Đang khởi tạo bản đồ vệ tinh vệ gia...</p>
          </div>
        )}
        <div id="leaflet-map-container" ref={containerRef} className="absolute inset-0 w-full h-full z-10" />
      </div>

      {/* Legend guide bar */}
      <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-wide text-slate-500 mt-2 border-t border-slate-50 pt-2 select-none">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#005BAA]"></span> Đã giao địa bàn</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Chưa giao địa bàn (Cảnh báo)</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-300"></span> NVKD đang trực tuyến</span>
        {showHeatmap && <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500/40"></span> Phân bổ tập KH</span>}
      </div>
    </Card>
  );
}
