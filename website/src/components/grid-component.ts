// Types for grid coordinates
interface Point {
    x: number;
    y: number;
}

// Configuration Constants
const TARGET_TILE_COUNT: number = 2000;
const GLOW_COLOR: string = "#00f2ff";

class MosaicProject {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private grid: Point[] = [];
    private foundImages: HTMLImageElement[] = [];
    private modeDisplay: HTMLElement | null;
    private countDisplay: HTMLElement | null;
    private tileSize: number = 0;

    constructor() {
        // Find elements in the DOM injected by the Router
        this.canvas = document.getElementById('mosaicCanvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        this.modeDisplay = document.getElementById('mode');
        this.countDisplay = document.getElementById('count');

        if (!this.canvas) {
            console.error("Mosaic Error: Canvas not found. Ensure GridComponent is mounted.");
            return;
        }

        this.init();
    }

    private init(): void {
        // Set canvas to full screen
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        // Dynamic Tile Size Calculation based on screen area
        const screenArea = this.canvas.width * this.canvas.height;
        this.tileSize = Math.sqrt(screenArea / TARGET_TILE_COUNT);

        // Generate the sequential grid (Top-Left to Bottom-Right)
        for (let y = 0; y < this.canvas.height; y += this.tileSize) {
            for (let x = 0; x < this.canvas.width; x += this.tileSize) {
                this.grid.push({ x, y });
            }
        }
        
        this.scanAssets(1);
    }

    private scanAssets(num: number): void {
        const img = new Image();
        
        // Use a relative path (no leading slash) 
        // This ensures it works on GitHub Pages subfolders
        img.src = `${num}.jpg`; 
        
        img.onload = () => {
            this.foundImages.push(img);
            if (this.foundImages.length < this.grid.length) {
                this.scanAssets(num + 1);
            } else {
                this.startRendering();
            }
        };
        
        img.onerror = () => {
            // This is where the code goes if it can't find 1.jpg
            console.error(`Failed to load: ${img.src}`);
            this.startRendering();
        };
    }

    private async startRendering(): Promise<void> {
        const total = this.foundImages.length;
        if (total === 0) {
            this.updateUI("No Assets Found", 0);
            return;
        }

        this.updateUI("Reconstructing", 0);

        for (let i = 0; i < total; i++) {
            const isLatest = (i === total - 1);
            const pos = this.grid[i];
            const img = this.foundImages[i];

            if (isLatest) {
                this.updateUI("New Update Detected", i + 1);
                await this.glowUp(img, pos);
            } else {
                // Instant draw for existing progress to be fast
                this.drawInstant(img, pos);
                // Update UI every 20 tiles to prevent UI lag
                if (i % 20 === 0) {
                    this.updateUI("Reconstructing", i + 1);
                    // Yield to browser to keep it responsive
                    await new Promise(r => requestAnimationFrame(r));
                }
            }
        }
        this.updateUI("Standby", total);
    }

    private drawInstant(img: HTMLImageElement, pos: Point): void {
        this.ctx.globalAlpha = 1.0;
        this.ctx.drawImage(img, pos.x, pos.y, this.tileSize, this.tileSize);
    }

    private glowUp(img: HTMLImageElement, pos: Point): Promise<void> {
        return new Promise((resolve) => {
            let opacity = 0;
            let glow = 0;
            
            const step = () => {
                opacity += 0.03; 
                glow += 1.2;
                
                this.ctx.globalAlpha = opacity;
                this.ctx.shadowBlur = glow;
                this.ctx.shadowColor = GLOW_COLOR;
                
                // Scale effect: "pop" in from 15% larger
                const pulseScale = 1.15 - (0.15 * opacity);
                const currentSize = this.tileSize * pulseScale;
                const offset = (currentSize - this.tileSize) / 2;
                
                this.ctx.clearRect(pos.x, pos.y, this.tileSize, this.tileSize);
                this.ctx.drawImage(img, pos.x - offset, pos.y - offset, currentSize, currentSize);
                
                if (opacity < 1) {
                    requestAnimationFrame(step);
                } else {
                    this.ctx.shadowBlur = 0;
                    resolve();
                }
            };
            step();
        });
    }

    private updateUI(mode: string, count: number): void {
        if (this.modeDisplay) this.modeDisplay.innerText = mode;
        if (this.countDisplay) this.countDisplay.innerText = `${count} / ${this.grid.length}`;
    }
}

/**
 * Functional component for the Router.
 * It injects the HTML and then initializes the Mosaic logic.
 */
export const GridComponent = () => {
    // We use a microtask (setTimeout 0) to wait until the 
    // Router has finished adding this string to the DOM.
    setTimeout(() => {
        new MosaicProject();
    }, 0);

    return `
    <div id="bg-image"></div>
    <div id="status-plate">
        Status: <span id="mode">Initializing...</span><br>
        Tiles: <span id="count">0</span>
    </div>
    <canvas id="mosaicCanvas"></canvas>`;
}

export default GridComponent;