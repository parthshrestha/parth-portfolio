export interface Rect {x:number; y:number; width:number; height:number}
export function intersects(a:Rect,b:Rect,padding=10) {return a.x < b.x+b.width+padding && a.x+a.width+padding>b.x && a.y<b.y+b.height+padding && a.y+a.height+padding>b.y;}
export function chooseAnchor(width:number,height:number,obstacles:Rect[], size=112,tall=size):Rect|null {
  const candidates = [height-tall-110, height*.5, 100].flatMap(y => [width-size-16,16].map(x=>({x,y,width:size,height:tall})));
  return candidates.find(a=>a.x>=0 && a.y>=90 && a.y+a.height<height-100 && !obstacles.some(b=>intersects(a,b))) ?? null;
}
export function pathClear(a:Rect,b:Rect,obstacles:Rect[]) {
  const swept = {x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),width:Math.abs(a.x-b.x)+a.width,height:Math.abs(a.y-b.y)+a.height};
  return !obstacles.some(o=>intersects(swept,o));
}
