;(function(win, Canim, Ease){
  var Sprite = function(canim, img, start, delay, duration){
    var ctx = canim.ctx, s = start || [1,0,0,1,0,0], sprite = {
      canim: canim, img: img, _delay: delay || 0, _duration: duration, angle:0,
      _start: s, _m: [1,0,0,1,s[4],s[5]], _stop:false,
    }, _ = function(m,n){
      return [m[0]*n[0]+m[2]*n[1], m[1]*n[0]+m[3]*n[1], 
              m[0]*n[2]+m[2]*n[3], m[1]*n[2]+m[3]*n[3], 
              m[0]*n[4]+m[2]*n[5]+m[4], m[1]*n[4]+m[3]*n[5]+m[5]]
    }, a2m = function(a){var c=Math.cos(a),s=Math.sin(a);return [c,-s,s,c,0,0]}
    sprite.end = function(){
        return _(sprite._m, a2m(sprite.angle))
    }
    sprite.next = function(duration){
      return sprite.stop().canim.sprite(img, sprite.end(), sprite._delay+sprite._duration, duration)
    }
    sprite.getTransform = function(t){
      var de = sprite._delay, du = sprite._duration, k = du==0?1:(t - de)/du, m=sprite._m;
      k = k > 1 ? 1 : sprite._ease(k)
      return _(sprite._start.map(function(n, i){return (m[i]-n) * k + n}), a2m(sprite.angle*k))
    }
    sprite.transform = function(n, isStart){
      isStart?sprite._start = _(sprite._start, n):sprite._m = _(sprite._m, n)
      return sprite
    }
    sprite.rotate = function(r, isStart){
      isStart?sprite._start=_(sprite._start,a2m(r)):sprite.angle+=r;
      return sprite
    }
    sprite.scale = function(sx,sy, isStart){
      return sprite.transform([sx,0,0,sy||sx,0,0], isStart)
    }
    sprite.move = sprite.translate = function(x,y,isStart){
      return sprite.transform([1,0,0,1,x,y],isStart)
    }
    sprite.start = function(x,y){ sprite._start[4] = x;sprite._start[5] = y;return sprite.move(x,y)}
    sprite.moveTo = function(x,y){ sprite._m[4] = x;sprite._m[5] = y;return sprite}
    sprite.setTransform = function(m){sprite._m=m;return sprite}
    sprite.delay = function(d){sprite._delay=d;return sprite}
    sprite.duration = function(d){sprite._duration=d;return sprite}
    sprite.stop = function(){sprite._stop=true;return sprite}
    sprite.ease = function(e){sprite._ease=new Ease(e);return sprite}
    sprite.draw = function(){
      if (canim.current < sprite._delay) return
      else if (sprite._stop && canim.current > sprite._delay + sprite._duration){
          sprite.onend&&sprite.onend(sprite)
          return sprite.onend=null;
      }else if (sprite.onstart) {
          sprite.onstart(sprite)
          sprite.onstart = null;
      }
      Canim.transform.apply(ctx, sprite.getTransform(canim.current))
      if (typeof img == "function")
          img.call(canim, ctx)
      else ctx.drawImage(img, -img.naturalWidth/2, -img.naturalHeight/2)
    }
    return sprite
  }
  Canim.scene = function(width, height, duration, sprites, autostart){
    var time = function(){return new Date().getTime() / 1000;}, ctx = this, canvas = ctx.canvas
    , raf = win.requestAnimationFrame || win.webkitRequestAnimationFrame || win.mozRequestAnimationFrame ||
        function( callback ){win.setTimeout(callback, 1000 / 60);}
    , canim = {canvas: canvas, ctx: ctx, width: canvas.width, height: canvas.height, begin: time(), end: duration, sprites: sprites || []}
    , reset = function(){
        canvas.width = width
        canvas.height = height
        ctx.setTransform(1,0,0,1,0,0)
        ctx.clearRect(0, 0, width, height);
    }, draw = function(){
        canim.current = time() - canim.begin
        if (canim.end && canim.current >= canim.end) return;
        reset()
        canim.sprites.forEach(function(s){
          Canim.setTransform.apply(ctx, canim.getTransform())
          s.draw()
        })
        raf(draw)
    }
    canim.getTransform = function(){
      var w = width, h = height, t1 = w/h, t2 = canim.width/canim.height, k1 = w/canim.width, k2 = h/canim.height;
      canim._t = t1>t2 ? [k1, 0, 0, k1, 0, (h-w/t2)/2] : [k2, 0, 0, k2, (w-h*t2)/2, 0]
      return canim._t
    }
    canim.start = function(){draw()}
    canim.sprite = function(img, start, delay, duration){
      var s = Sprite(canim, img, start, delay, duration)
      canim.sprites.push(s)
      return s
    }
    reset() &&  autostart && canim.start()
    return canim
  }
})(window, CanvasRenderingContext2D.prototype, window.Ease || function(){return function(k){return k}})

