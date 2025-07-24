import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ZoomIn, ZoomOut, Plus, Terminal } from 'lucide-react';

interface Tile {
  id: string;
  x: number;
  y: number;
  html: string;
  timestamp: number;
}

const GRID_SIZE = 20; // 20x20 grid for MVP
const TILE_SIZE = 120; // Base tile size in pixels

export const CodeGrid = () => {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [zoom, setZoom] = useState(1);
  const [selectedTile, setSelectedTile] = useState<{ x: number; y: number } | null>(null);
  const [editingHtml, setEditingHtml] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  // Initialize with some demo tiles
  useEffect(() => {
    const demoTiles: Tile[] = [
      {
        id: '0-0',
        x: 0,
        y: 0,
        html: '<div style="background: linear-gradient(45deg, #ff00ff, #00ffff); padding: 20px; text-align: center; color: white; font-weight: bold;">Welcome to<br/>CodePlace!</div>',
        timestamp: Date.now()
      },
      {
        id: '1-0',
        x: 1,
        y: 0,
        html: '<div style="background: #1a1a1a; color: #00ff00; padding: 10px; font-family: monospace;">console.log("Hello World!");<br/>// Edit any tile<br/>// Upload HTML<br/>// Create chaos!</div>',
        timestamp: Date.now()
      },
      {
        id: '0-1',
        x: 0,
        y: 1,
        html: '<div style="background: radial-gradient(circle, #ff6b6b, #4ecdc4); padding: 20px; animation: pulse 2s infinite;"><style>@keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }</style>🌈 MEME ZONE 🌈</div>',
        timestamp: Date.now()
      }
    ];
    setTiles(demoTiles);
  }, []);

  const handleTileClick = (x: number, y: number) => {
    const existingTile = tiles.find(t => t.x === x && t.y === y);
    setSelectedTile({ x, y });
    setEditingHtml(existingTile?.html || '<div style="padding: 20px; background: #2a2a2a; color: #00ffff;">Your HTML here...</div>');
    setIsEditing(true);
  };

  const saveTile = () => {
    if (!selectedTile) return;
    
    const newTile: Tile = {
      id: `${selectedTile.x}-${selectedTile.y}`,
      x: selectedTile.x,
      y: selectedTile.y,
      html: editingHtml,
      timestamp: Date.now()
    };

    setTiles(prev => {
      const filtered = prev.filter(t => !(t.x === selectedTile.x && t.y === selectedTile.y));
      return [...filtered, newTile];
    });

    setIsEditing(false);
    setSelectedTile(null);
  };

  const renderTile = (x: number, y: number) => {
    const tile = tiles.find(t => t.x === x && t.y === y);
    const isEmpty = !tile;

    return (
      <div
        key={`${x}-${y}`}
        className={`
          relative border border-tile-border bg-card hover:border-tile-glow cursor-pointer
          ${isEmpty ? 'hover:bg-muted/20' : 'hover:tile-glow'}
        `}
        style={{
          width: TILE_SIZE * zoom,
          height: TILE_SIZE * zoom,
          minWidth: TILE_SIZE * zoom,
          minHeight: TILE_SIZE * zoom,
        }}
        onClick={() => handleTileClick(x, y)}
      >
        {isEmpty ? (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Plus size={16} />
          </div>
        ) : (
          <iframe
            srcDoc={tile.html}
            className="w-full h-full border-0 pointer-events-none"
            sandbox="allow-same-origin"
            title={`Tile ${x},${y}`}
          />
        )}
        <div className="absolute top-1 left-1 text-xs text-muted-foreground bg-background/80 px-1 rounded">
          {x},{y}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-screen bg-background overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-primary terminal-glow">
            <Terminal className="inline mr-2" />
            CodePlace
          </h1>
          <div className="text-sm text-muted-foreground">
            Collaborative HTML Grid World
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
            disabled={zoom <= 0.5}
          >
            <ZoomOut size={16} />
          </Button>
          <span className="text-sm text-muted-foreground min-w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom(Math.min(2, zoom + 0.25))}
            disabled={zoom >= 2}
          >
            <ZoomIn size={16} />
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div
        ref={gridRef}
        className="w-full h-full overflow-auto p-4"
        style={{
          backgroundImage: `
            linear-gradient(rgba(var(--grid-line) / 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(var(--grid-line) / 0.3) 1px, transparent 1px)
          `,
          backgroundSize: `${TILE_SIZE * zoom}px ${TILE_SIZE * zoom}px`,
        }}
      >
        <div className="grid gap-0" style={{ 
          gridTemplateColumns: `repeat(${GRID_SIZE}, ${TILE_SIZE * zoom}px)`,
          width: 'max-content'
        }}>
          {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => {
            const x = i % GRID_SIZE;
            const y = Math.floor(i / GRID_SIZE);
            return renderTile(x, y);
          })}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-primary terminal-glow">
              Edit Tile {selectedTile?.x},{selectedTile?.y}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                HTML Code (max 2KB):
              </label>
              <Textarea
                value={editingHtml}
                onChange={(e) => setEditingHtml(e.target.value)}
                className="font-mono text-sm bg-code-bg border-tile-border"
                rows={10}
                placeholder="<div>Your HTML here...</div>"
              />
            </div>
            
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Preview:
              </label>
              <div className="border border-tile-border bg-card" style={{ height: TILE_SIZE }}>
                <iframe
                  srcDoc={editingHtml}
                  className="w-full h-full border-0"
                  sandbox="allow-same-origin"
                  title="Preview"
                />
              </div>
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={saveTile} className="bg-primary text-primary-foreground">
                Save Tile
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};