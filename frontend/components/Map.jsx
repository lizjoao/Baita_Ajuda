import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

const colors = ['#00FFCC', '#FF0099', '#FF3300', '#FF9933', '#33CCFF', '#33FF33', '#6600FF', '#FFFF00'];
const COLORS = ['#667eea', '#764ba2', '#00FFCC']; // 3 cores suficientes

const Map = ({ shelters = [] }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    // Só executar no cliente
    if (typeof window === 'undefined') return;

    let isMounted = true;

    const initMap = async () => {
      try {
        // Importar Leaflet
        const L = (await import('leaflet')).default;

        // Verificar se o componente ainda está montado
        if (!isMounted) return;

        // Limpar mapa anterior
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        // Verificar se o container existe
        if (!mapRef.current) {
          console.error('Container do mapa não existe');
          return;
        }

        // Aguardar um pouco para o DOM estar pronto
        await new Promise(resolve => setTimeout(resolve, 100));

        // Verificar novamente se está montado
        if (!isMounted || !mapRef.current) return;

        // Criar mapa
        const map = L.map(mapRef.current, {
          center: [-30.0346, -51.2177],
          zoom: 12,
          scrollWheelZoom: true,
          zoomControl: true
        });

        mapInstanceRef.current = map;

        // Adicionar tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(map);

        // Adicionar marcadores
        const markers = [];
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

          const marker = L.marker([lat, lng], { icon })
            .bindPopup(`
              <div style="min-width: 200px; padding: 8px;">
                <strong style="font-size: 16px; color: #333;">${shelter.nome}</strong><br/>
                <span style="color: #666; font-size: 14px;">${shelter.endereco}</span><br/>
                <span style="color: ${shelter.vagas_disponiveis > 0 ? '#28a745' : '#dc3545'}; font-weight: bold; margin-top: 8px; display: inline-block;">
                  Vagas: ${shelter.vagas_disponiveis || 0}
                </span>
                ${shelter.aceita_pets ? '<br/><span style="background: #e3f2fd; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-top: 4px; display: inline-block;">🐾 Aceita Pets</span>' : ''}
              </div>
            `)
            .addTo(map);

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

        // Ajustar zoom para mostrar todos os marcadores
	  if (markers.length === 1) {
	      const marker = markers[0];
	      const latLng = marker.getLatLng();

	      map.setView(latLng, 16);
	  } else if (markers.length > 1) {
	      const group = new L.featureGroup(markers);
	      map.fitBounds(group.getBounds().pad(0.1));
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
