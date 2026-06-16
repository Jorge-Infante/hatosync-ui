<template>
  <svg
    ref="root"
    class="cow"
    viewBox="0 0 200 185"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Vaca de HatoSync"
  >
    <defs>
      <clipPath id="cowEyeL"><ellipse cx="76" cy="92" rx="16" ry="18" /></clipPath>
      <clipPath id="cowEyeR"><ellipse cx="124" cy="92" rx="16" ry="18" /></clipPath>
    </defs>

    <!-- Everything that tilts together -->
    <g class="cow-head">
      <!-- Horns (behind the face) -->
      <ellipse class="cow-horn" cx="60" cy="50" rx="9" ry="12" transform="rotate(-22 60 50)" />
      <ellipse class="cow-horn" cx="140" cy="50" rx="9" ry="12" transform="rotate(22 140 50)" />

      <!-- Ears -->
      <g class="cow-ear cow-ear-left">
        <ellipse class="cow-ear-outer" cx="38" cy="74" rx="21" ry="13" transform="rotate(-24 38 74)" />
        <ellipse class="cow-ear-inner" cx="40" cy="74" rx="11" ry="6.5" transform="rotate(-24 40 74)" />
      </g>
      <g class="cow-ear cow-ear-right">
        <ellipse class="cow-ear-outer" cx="162" cy="74" rx="21" ry="13" transform="rotate(24 162 74)" />
        <ellipse class="cow-ear-inner" cx="160" cy="74" rx="11" ry="6.5" transform="rotate(24 160 74)" />
      </g>

      <!-- Forelock tuft -->
      <circle class="cow-tuft" cx="86" cy="48" r="11" />
      <circle class="cow-tuft" cx="100" cy="44" r="13" />
      <circle class="cow-tuft" cx="114" cy="48" r="11" />

      <!-- Face -->
      <ellipse class="cow-face" cx="100" cy="100" rx="66" ry="60" />

      <!-- Spots -->
      <path
        class="cow-spot"
        d="M58 74q-12 8-7 22 6 14 20 8 13-6 6-22-8-16-19-8z"
      />
      <ellipse class="cow-spot" cx="142" cy="120" rx="15" ry="12" transform="rotate(18 142 120)" />

      <!-- Muzzle -->
      <ellipse class="cow-muzzle" cx="100" cy="134" rx="42" ry="30" />
      <ellipse class="cow-nostril" cx="86" cy="132" rx="5" ry="7.5" />
      <ellipse class="cow-nostril" cx="114" cy="132" rx="5" ry="7.5" />
      <path class="cow-smile" d="M88 150q12 9 24 0" />

      <!-- Eyes -->
      <g clip-path="url(#cowEyeL)">
        <ellipse class="cow-eye-white" cx="76" cy="92" rx="16" ry="18" />
        <g class="cow-pupil cow-pupil-left">
          <circle cx="76" cy="92" r="7.5" />
          <circle class="cow-shine" cx="73" cy="89" r="2.6" />
        </g>
        <ellipse class="cow-lid" cx="76" cy="92" rx="17" ry="19" transform="translate(0 -38)" />
      </g>
      <ellipse class="cow-eye-line" cx="76" cy="92" rx="16" ry="18" />

      <g clip-path="url(#cowEyeR)">
        <ellipse class="cow-eye-white" cx="124" cy="92" rx="16" ry="18" />
        <g class="cow-pupil cow-pupil-right">
          <circle cx="124" cy="92" r="7.5" />
          <circle class="cow-shine" cx="121" cy="89" r="2.6" />
        </g>
        <ellipse class="cow-lid" cx="124" cy="92" rx="17" ry="19" transform="translate(0 -38)" />
      </g>
      <ellipse class="cow-eye-line" cx="124" cy="92" rx="16" ry="18" />
    </g>

    <!-- Hooves rise from below to cover the eyes (outside the head so they sit on top) -->
    <g class="cow-hoof cow-hoof-left" transform="translate(0 155)">
      <rect class="cow-arm" x="63" y="92" width="26" height="80" rx="13" />
      <ellipse class="cow-hoof-tip" cx="76" cy="92" rx="20" ry="22" />
      <path class="cow-cleft" d="M76 76v30" />
    </g>
    <g class="cow-hoof cow-hoof-right" transform="translate(0 155)">
      <rect class="cow-arm" x="111" y="92" width="26" height="80" rx="13" />
      <ellipse class="cow-hoof-tip" cx="124" cy="92" rx="20" ry="22" />
      <path class="cow-cleft" d="M124 76v30" />
    </g>
  </svg>
</template>

<script>
import { gsap } from 'gsap'

// Pose targets per state. Head uses rotation/x (idle bob owns y); lids/hooves
// use y (translate); pupils translate within their clipped eye.
const POSES = {
  forward: { head: { r: 0, x: 0 }, pupil: { x: 0, y: 2 }, lid: -38, hoof: 155 },
  away: { head: { r: -8, x: -5 }, pupil: { x: -5, y: 0 }, lid: 0, hoof: 0 },
  peek: { head: { r: 5, x: 3 }, pupil: { x: 5, y: 6 }, lid: -16, hoof: 50 },
}

export default {
  name: 'CowMascot',
  props: {
    // 'forward' | 'away' | 'peek'
    state: { type: String, default: 'forward' },
  },
  data() {
    return {
      reduce: false,
      els: null,
      idleTween: null,
      blinkCall: null,
    }
  },
  watch: {
    state(next) {
      this.pose(next)
    },
  },
  mounted() {
    this.reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const root = this.$refs.root
    const q = (sel) => gsap.utils.toArray(root.querySelectorAll(sel))
    this.els = {
      head: root.querySelector('.cow-head'),
      pupils: q('.cow-pupil'),
      lids: q('.cow-lid'),
      hooves: q('.cow-hoof'),
    }

    gsap.set(this.els.head, { transformOrigin: '50% 82%' })
    this.pose(this.state, true) // sync GSAP transforms with the markup's initial pose

    if (!this.reduce) {
      this.idleTween = gsap.to(this.els.head, {
        y: '+=3',
        duration: 3,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      })
      this.scheduleBlink()
    }
  },
  beforeUnmount() {
    if (this.blinkCall) this.blinkCall.kill()
    if (this.idleTween) this.idleTween.kill()
    if (this.els) {
      gsap.killTweensOf([
        this.els.head,
        ...this.els.pupils,
        ...this.els.lids,
        ...this.els.hooves,
      ])
    }
  },
  methods: {
    pose(state, instant = false) {
      const p = POSES[state] || POSES.forward
      const duration = this.reduce || instant ? 0 : 0.5
      gsap.to(this.els.head, { rotation: p.head.r, x: p.head.x, duration, ease: 'power3.out', overwrite: 'auto' })
      gsap.to(this.els.pupils, { x: p.pupil.x, y: p.pupil.y, duration, ease: 'power3.out', overwrite: 'auto' })
      gsap.to(this.els.lids, { y: p.lid, duration: duration * 0.8, ease: 'power3.out', overwrite: 'auto' })
      gsap.to(this.els.hooves, {
        y: p.hoof,
        duration,
        ease: state === 'away' ? 'back.out(1.5)' : 'power3.out',
        overwrite: 'auto',
      })
    },
    scheduleBlink() {
      this.blinkCall = gsap.delayedCall(gsap.utils.random(2.5, 6.5), () => {
        // Only blink when the eyes are open and uncovered
        if (this.state === 'forward') {
          gsap
            .timeline()
            .to(this.els.lids, { y: 0, duration: 0.08, ease: 'power2.in' })
            .to(this.els.lids, { y: -38, duration: 0.14, ease: 'power2.out' })
        }
        this.scheduleBlink()
      })
    },
  },
}
</script>

<style scoped>
.cow {
  display: block;
  width: 104px;
  height: auto;
  /* Clip to the viewBox so the hooves, parked below the frame at rest,
     stay hidden instead of spilling onto the title underneath. */
  overflow: hidden;
}

.cow-face,
.cow-ear-outer {
  fill: #fdfcf8;
  stroke: rgba(46, 82, 51, 0.2);
  stroke-width: 2;
}
.cow-ear-inner {
  fill: #e7c9a0;
}
.cow-horn {
  fill: #e8c98a;
  stroke: rgba(46, 82, 51, 0.18);
  stroke-width: 1.5;
}
.cow-tuft {
  fill: #efe7d5;
}
.cow-spot {
  fill: #6f8a73;
}
.cow-muzzle {
  fill: #f2e8d6;
  stroke: rgba(46, 82, 51, 0.16);
  stroke-width: 1.5;
}
.cow-nostril {
  fill: #c79a64;
}
.cow-smile {
  fill: none;
  stroke: rgba(34, 43, 35, 0.4);
  stroke-width: 2.4;
  stroke-linecap: round;
}

.cow-eye-white {
  fill: #ffffff;
}
.cow-pupil circle {
  fill: #2a2f28;
}
.cow-shine {
  fill: #ffffff;
}
.cow-lid {
  fill: #fdfcf8;
}
.cow-eye-line {
  fill: none;
  stroke: rgba(46, 82, 51, 0.32);
  stroke-width: 1.6;
}

.cow-arm,
.cow-hoof-tip {
  fill: #3f5847;
}
.cow-cleft {
  fill: none;
  stroke: rgba(20, 30, 24, 0.55);
  stroke-width: 2;
  stroke-linecap: round;
}
.cow-pupil,
.cow-lid,
.cow-hoof,
.cow-head {
  will-change: transform;
}
</style>
