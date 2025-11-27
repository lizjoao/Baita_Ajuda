import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

const colors = ['#00FFCC', '#FF0099', '#FF3300', '#FF9933', '#33CCFF', '#33FF33', '#6600FF', '#FFFF00'];
const COLORS = ['#667eea', '#764ba2', '#00FFCC']; // 3 cores suficientes

const Map = ({ shelters = [] }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    // Só executar no cliente
    if (typeof window === 'undefined') return;

    let isMounted = true;

    const initMap = async () => {
      try {
        // Importar CSS do Leaflet primeiro (apenas no cliente)
        try {
          // dynamic import so this runs only client-side
          await import('leaflet/dist/leaflet.css');
        } catch (e) {
          // ignore if css can't be imported dynamically
          // the bundle may already include leaflet css
        }

        // Importar Leaflet
        const L = (await import('leaflet')).default;

        // Verificar se o componente ainda está montado
        if (!isMounted) return;

        // If map already initialized, don't remove it completely — we'll reuse it and just update markers.
        // Removing/creating the map repeatedly can cause Leaflet internal errors (eg. _leaflet_pos undefined)
        // especially in React Strict Mode during dev. We'll initialize the map only once.

        // Verificar se o container existe
        if (!mapRef.current) {
          console.error('Container do mapa não existe');
          return;
        }

        // Aguardar um pouco para o DOM estar pronto
        await new Promise(resolve => setTimeout(resolve, 100));

        // Verificar novamente se está montado
        if (!isMounted || !mapRef.current) return;

        // Create map only once
        if (!mapInstanceRef.current) {
          const map = L.map(mapRef.current, {
            center: [-30.0346, -51.2177],
            zoom: 12,
            scrollWheelZoom: true,
            zoomControl: true,
            // disable animated zoom to avoid Leaflet trying to read transient DOM positions
            zoomAnimation: false
          });

          mapInstanceRef.current = map;

          // Adicionar tiles
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19
          }).addTo(map);
        }

        const map = mapInstanceRef.current;

        // Adicionar marcadores usando um layerGroup — remove previous layer to avoid recreating the map
        if (markersLayerRef.current) {
          try { markersLayerRef.current.clearLayers(); } catch (e) { markersLayerRef.current = null; }
        }

        const markers = [];
        const layerGroup = L.layerGroup();
        shelters.forEach((shelter, index) => {
          const lat = shelter.latitude || shelter.lat || (-30.0346 + (Math.random() - 0.5) * 0.1);
          const lng = shelter.longitude || shelter.lng || (-51.2177 + (Math.random() - 0.5) * 0.1);

          const color = COLORS[index % COLORS.length];

          const icon = L.divIcon({
            html: `<div role="button" aria-label="Abrigo ${shelter.nome}" style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); cursor: pointer;"></div>`,
            className: 'custom-marker',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
            popupAnchor: [0, -12]
          });

          const avg = shelter.media_avaliacoes ?? shelter.media_avaliacao ?? shelter.rating ?? null;
          const totalReviews = shelter.total_avaliacoes ?? shelter.totalAvaliacoes ?? 0;
          const acceptsPets = shelter.aceita_pets ? 'Sim' : 'Não';
          const acceptsWomen = shelter.tipo_feminino ? 'Sim' : 'Não';
          const acceptsMen = shelter.tipo_masculino ? 'Sim' : 'Não';

          const marker = L.marker([lat, lng], { icon })
            .bindPopup(`
              <div style="min-width: 220px; padding: 10px; font-family: Arial, sans-serif; color: #222;">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                  <div style="flex:1;">
                    <strong style="font-size:14px; display:block; margin-bottom:4px;">${shelter.nome}</strong>
                    <div style="font-size:12px; color:#666; margin-bottom:6px;">${shelter.endereco || ''}</div>
                    <div style="font-size:13px; margin-bottom:6px;"><span style="font-weight:700;color:${(shelter.vagas_disponiveis || 0) > 0 ? '#28a745' : '#dc3545'}">Vagas: ${shelter.vagas_disponiveis ?? shelter.vagas ?? 0}</span></div>
                    <div style="font-size:12px;color:#444;margin-bottom:6px;">Avaliação: <span style="font-weight:700;color:#ffb400;">${avg ? avg + ' ⭐' : '—'}</span> <small style="color:#666">(${totalReviews})</small></div>
                      ${''}
                  </div>
                </div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;">
                  <div style="background:#e3f2fd;padding:4px 8px;border-radius:12px;font-size:12px;">🐾 Pets: <strong style="margin-left:6px;">${acceptsPets}</strong></div>
                  <div style="background:#f3e5f5;padding:4px 8px;border-radius:12px;font-size:12px;">♀ Mulheres: <strong style="margin-left:6px;">${acceptsWomen}</strong></div>
                  <div style="background:#e8f5e9;padding:4px 8px;border-radius:12px;font-size:12px;">♂ Homens: <strong style="margin-left:6px;">${acceptsMen}</strong></div>
                </div>
                <div style="margin-top:8px;text-align:right;">
                  <a href="/shelters/${shelter.id || shelter._id}" style="text-decoration:none;color:#fff;background:#467fcf;padding:6px 10px;border-radius:6px;font-size:12px;">Ver detalhes</a>
                </div>
              </div>
            `)
            .addTo(layerGroup);

          // Mostrar popup ao passar o mouse e ocultar ao sair
          // Use handlers defensivos: só abrir/fechar se o marker estiver no mapa e o elemento existir
          try {
            marker.on('mouseover', function () {
              try {
                if (this && this._map && this._icon) this.openPopup();
              } catch (err) {
                // swallow leaflet internal errors to avoid breaking the app
                console.warn('popup open error (ignored):', err.message);
              }
            });
            marker.on('mouseout', function () {
              try {
                if (this && this._map && this._icon) this.closePopup();
              } catch (err) {
                console.warn('popup close error (ignored):', err.message);
              }
            });
          } catch (e) {
            // alguns ambientes podem não suportar os eventos do leaflet - não bloquear
            console.warn('Erro ao adicionar hover handlers no marcador', e.message);
          }

          // Ao clicar no marcador, navegar para a página pública de detalhes/doações
          try {
            if (shelter && (shelter.id || shelter._id)) {
              const shelterId = shelter.id || shelter._id;
              marker.on('click', () => {
                // Usamos router.push para navegar sem recarregar a página
                router.push(`/shelters/${shelterId}`);
              });
            }
          } catch (e) {
            // não bloquear a inicialização do mapa se router falhar
            console.warn('Erro ao adicionar handler de clique do marcador', e);
          }

          markers.push(marker);
        });
        // add layerGroup to map and keep reference
        try {
          layerGroup.addTo(map);
          markersLayerRef.current = layerGroup;
        } catch (e) {
          console.warn('Erro ao adicionar layerGroup ao mapa', e.message);
        }

        // Ajustar zoom para mostrar todos os marcadores
        if (markers.length === 1) {
          const marker = markers[0];
          const latLng = marker.getLatLng();
          try {
            map.setView(latLng, 16);
          } catch (e) {
            console.warn('Erro ao setView (ignorado):', e.message);
          }
        } else if (markers.length > 1) {
          const group = new L.featureGroup(markers);
          try {
            map.fitBounds(group.getBounds().pad(0.1));
          } catch (e) {
            console.warn('Erro ao fitBounds (ignorado):', e.message);
          }
        }

        setTimeout(() => {
          if (isMounted && mapInstanceRef.current) {
            try {
              mapInstanceRef.current.invalidateSize();
            } catch (e) {}
          }
        }, 250);

      } catch (error) {
        console.error('Erro ao inicializar mapa:', error);
      }
    };

    initMap();

    // Cleanup
    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        } catch (e) {
          console.warn('Erro ao limpar mapa:', e.message);
        }
      }
    };
  }, [shelters]);

  return (
    <div
      ref={mapRef}
      style={{
        height: '100%',
        width: '100%',
        minHeight: '400px',
        background: '#e5e3df',
        borderRadius: '12px'
      }}
    />
  );
};

export default Map;
