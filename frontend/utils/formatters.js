export const formatDistance = (meters) => 
  meters < 1000 
    ? `${Math.round(meters)} m` 
    : `${(meters / 1000).toFixed(1)} km`