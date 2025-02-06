export interface Box {
  id: string;
  x: number; // porcentaje relativo al ancho de la imagen (0-100)
  y: number; // porcentaje relativo al alto de la imagen (0-100)
  width: number; // porcentaje relativo al ancho de la imagen (0-100)
  height: number; // porcentaje relativo al alto de la imagen (0-100)
}

export interface ImageConfig {
  imageUrl: string;
  boxes: Box[];
} 