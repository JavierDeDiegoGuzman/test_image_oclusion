'use client'

import { useState, useRef, useEffect } from 'react'
import type { Box, ImageConfig } from './types'

export default function Home() {
  const [imageUrl, setImageUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [boxes, setBoxes] = useState<Box[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentBox, setCurrentBox] = useState<Box | null>(null)
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number, y: number } | null>(null)
  const [configText, setConfigText] = useState('')
  
  const imageContainerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  const handleImageLoad = () => {
    setError(null)
    console.log('Imagen cargada exitosamente')
  }

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.target as HTMLImageElement
    setError('Error al cargar la imagen')
    img.src = 'https://via.placeholder.com/400x300?text=Error+al+cargar+imagen'
    console.error('Error al cargar la imagen:', imageUrl)
  }

  const convertToRelativeCoordinates = (clientX: number, clientY: number): { x: number, y: number } => {
    if (!imageRef.current || !imageContainerRef.current) return { x: 0, y: 0 }

    const rect = imageContainerRef.current.getBoundingClientRect()
    const imageRect = imageRef.current.getBoundingClientRect()
    
    // Usar el tamaño real de la imagen renderizada
    const x = ((clientX - imageRect.left) / imageRect.width) * 100
    const y = ((clientY - imageRect.top) / imageRect.height) * 100

    return {
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y))
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!imageContainerRef.current || !imageRef.current) return
    
    const target = e.target as HTMLElement
    
    if (target.classList.contains('resize-handle')) {
      setIsResizing(true)
      setResizeHandle(target.dataset.handle || null)
      return
    }

    if (target.classList.contains('box')) {
      const boxId = target.dataset.boxId
      if (boxId) {
        setSelectedBoxId(boxId)
        setIsDragging(true)
        const { x, y } = convertToRelativeCoordinates(e.clientX, e.clientY)
        setDragStart({ x, y })
        return
      }
    }

    const { x, y } = convertToRelativeCoordinates(e.clientX, e.clientY)
    setIsDrawing(true)
    setSelectedBoxId(null)
    setCurrentBox({
      id: Date.now().toString(),
      x: x,
      y: y,
      width: 0,
      height: 0
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!imageRef.current || !imageContainerRef.current) return

    const { x: mouseX, y: mouseY } = convertToRelativeCoordinates(e.clientX, e.clientY)

    if (isDragging && selectedBoxId && dragStart) {
      const box = boxes.find(b => b.id === selectedBoxId)
      if (!box) return

      const deltaX = mouseX - dragStart.x
      const deltaY = mouseY - dragStart.y

      const newBox = {
        ...box,
        x: Math.max(0, Math.min(100 - box.width, box.x + deltaX)),
        y: Math.max(0, Math.min(100 - box.height, box.y + deltaY))
      }

      setBoxes(boxes.map(b => b.id === selectedBoxId ? newBox : b))
      setDragStart({ x: mouseX, y: mouseY })
    }
    else if (isResizing && selectedBoxId && resizeHandle) {
      const box = boxes.find(b => b.id === selectedBoxId)
      if (!box) return

      const newBox = { ...box }
      
      switch (resizeHandle) {
        case 'n':
          newBox.height = Math.max(1, box.y + box.height - mouseY)
          newBox.y = Math.min(mouseY, box.y + box.height - 1)
          break
        case 's':
          newBox.height = Math.max(1, mouseY - box.y)
          break
        case 'e':
          newBox.width = Math.max(1, mouseX - box.x)
          break
        case 'w':
          newBox.width = Math.max(1, box.x + box.width - mouseX)
          newBox.x = Math.min(mouseX, box.x + box.width - 1)
          break
        case 'nw':
          newBox.width = Math.max(1, box.x + box.width - mouseX)
          newBox.height = Math.max(1, box.y + box.height - mouseY)
          newBox.x = Math.min(mouseX, box.x + box.width - 1)
          newBox.y = Math.min(mouseY, box.y + box.height - 1)
          break
        case 'ne':
          newBox.width = Math.max(1, mouseX - box.x)
          newBox.height = Math.max(1, box.y + box.height - mouseY)
          newBox.y = Math.min(mouseY, box.y + box.height - 1)
          break
        case 'sw':
          newBox.width = Math.max(1, box.x + box.width - mouseX)
          newBox.height = Math.max(1, mouseY - box.y)
          newBox.x = Math.min(mouseX, box.x + box.width - 1)
          break
        case 'se':
          newBox.width = Math.max(1, mouseX - box.x)
          newBox.height = Math.max(1, mouseY - box.y)
          break
      }

      // Asegurar que la caja no se salga de la imagen
      newBox.x = Math.max(0, Math.min(100 - newBox.width, newBox.x))
      newBox.y = Math.max(0, Math.min(100 - newBox.height, newBox.y))

      setBoxes(boxes.map(b => b.id === selectedBoxId ? newBox : b))
    }
    else if (isDrawing && currentBox) {
      const width = mouseX - currentBox.x
      const height = mouseY - currentBox.y

      const newBox = {
        ...currentBox,
        x: width < 0 ? mouseX : currentBox.x,
        y: height < 0 ? mouseY : currentBox.y,
        width: Math.abs(width),
        height: Math.abs(height)
      }

      newBox.x = Math.max(0, Math.min(100 - newBox.width, newBox.x))
      newBox.y = Math.max(0, Math.min(100 - newBox.height, newBox.y))

      setCurrentBox(newBox)
    }
  }

  const handleMouseUp = () => {
    if (isDrawing && currentBox && Math.abs(currentBox.width) > 1 && Math.abs(currentBox.height) > 1) {
      const normalizedBox = {
        ...currentBox,
        width: Math.abs(currentBox.width),
        height: Math.abs(currentBox.height),
        x: currentBox.width < 0 ? currentBox.x + currentBox.width : currentBox.x,
        y: currentBox.height < 0 ? currentBox.y + currentBox.height : currentBox.y,
      }
      setBoxes([...boxes, normalizedBox])
    }
    setIsDrawing(false)
    setCurrentBox(null)
    setIsResizing(false)
    setResizeHandle(null)
    setIsDragging(false)
    setDragStart(null)
  }

  const handleConfigTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setConfigText(e.target.value)
    try {
      const config: ImageConfig = JSON.parse(e.target.value)
      setImageUrl(config.imageUrl)
      setBoxes(config.boxes)
      setError(null)
    } catch (error) {
      setError('Error al parsear el JSON')
    }
  }

  const exportConfig = () => {
    const config: ImageConfig = {
      imageUrl,
      boxes
    }
    const jsonString = JSON.stringify(config, null, 2)
    setConfigText(jsonString)
    
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'image-config.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const importConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const config: ImageConfig = JSON.parse(e.target?.result as string)
        setImageUrl(config.imageUrl)
        setBoxes(config.boxes)
      } catch (error) {
        setError('Error al cargar el archivo de configuración')
      }
    }
    reader.readAsText(file)
  }

  const removeBox = (id: string) => {
    setBoxes(boxes.filter(box => box.id !== id))
    setSelectedBoxId(null)
  }

  useEffect(() => {
    const config: ImageConfig = {
      imageUrl,
      boxes
    }
    setConfigText(JSON.stringify(config, null, 2))
  }, [imageUrl, boxes])

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Visualizador de Imágenes</h1>
        
        <div className="space-y-4">
          <div className="flex gap-4">
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Ingresa la URL de una imagen"
              className="flex-1 p-2 border rounded"
            />
            <input
              type="file"
              accept=".json"
              onChange={importConfig}
              className="hidden"
              id="config-input"
            />
            <button
              onClick={exportConfig}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={!imageUrl || boxes.length === 0}
            >
              Exportar
            </button>
            <label
              htmlFor="config-input"
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 cursor-pointer"
            >
              Importar
            </label>
          </div>

          {error && (
            <p className="text-red-500">{error}</p>
          )}

          {imageUrl && (
            <div className="border rounded p-4 select-none">
              <div
                ref={imageContainerRef}
                className="relative inline-block"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <img
                  ref={imageRef}
                  src={imageUrl}
                  alt="Imagen cargada"
                  className="max-w-full h-auto"
                  onError={handleImageError}
                  onLoad={handleImageLoad}
                  draggable={false}
                />
                {boxes.map((box) => (
                  <div
                    key={box.id}
                    data-box-id={box.id}
                    className={`box absolute border-2 ${
                      selectedBoxId === box.id 
                        ? 'border-blue-500 bg-blue-200' 
                        : 'border-red-500 bg-red-200'
                    } bg-opacity-30`}
                    style={{
                      left: `${box.x}%`,
                      top: `${box.y}%`,
                      width: `${box.width}%`,
                      height: `${box.height}%`,
                    }}
                    onDoubleClick={() => removeBox(box.id)}
                  >
                    {selectedBoxId === box.id && (
                      <>
                        <div className="resize-handle absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-full -top-1.5 -left-1.5 cursor-nw-resize" data-handle="nw" />
                        <div className="resize-handle absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-full -top-1.5 -right-1.5 cursor-ne-resize" data-handle="ne" />
                        <div className="resize-handle absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-full -bottom-1.5 -left-1.5 cursor-sw-resize" data-handle="sw" />
                        <div className="resize-handle absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-full -bottom-1.5 -right-1.5 cursor-se-resize" data-handle="se" />
                        <div className="resize-handle absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-full -top-1.5 left-1/2 -translate-x-1/2 cursor-n-resize" data-handle="n" />
                        <div className="resize-handle absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-full -bottom-1.5 left-1/2 -translate-x-1/2 cursor-s-resize" data-handle="s" />
                        <div className="resize-handle absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-full top-1/2 -left-1.5 -translate-y-1/2 cursor-w-resize" data-handle="w" />
                        <div className="resize-handle absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-full top-1/2 -right-1.5 -translate-y-1/2 cursor-e-resize" data-handle="e" />
                      </>
                    )}
                  </div>
                ))}
                {currentBox && (
                  <div
                    className="absolute border-2 border-blue-500 bg-blue-200 bg-opacity-30"
                    style={{
                      left: `${currentBox.width < 0 ? currentBox.x + currentBox.width : currentBox.x}%`,
                      top: `${currentBox.height < 0 ? currentBox.y + currentBox.height : currentBox.y}%`,
                      width: `${Math.abs(currentBox.width)}%`,
                      height: `${Math.abs(currentBox.height)}%`,
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Configuración JSON</h2>
            <button
              onClick={() => navigator.clipboard.writeText(configText)}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            >
              Copiar al portapapeles
            </button>
          </div>
          <textarea
            value={configText}
            onChange={handleConfigTextChange}
            className="w-full h-48 p-2 font-mono text-sm border rounded bg-gray-50"
            placeholder="Pega aquí el JSON de configuración..."
          />
        </div>

        <div className="mt-4 p-4 bg-gray-100 rounded">
          <p className="text-sm">URL actual: {imageUrl || 'Ninguna URL ingresada'}</p>
          <p className="text-sm">Cajas dibujadas: {boxes.length}</p>
        </div>
      </div>
    </main>
  )
}
