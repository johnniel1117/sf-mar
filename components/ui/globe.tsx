'use client'

import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface ArcData {
  order: number
  startLat: number
  startLng: number
  endLat: number
  endLng: number
  arcAlt: number
  color: string
}

interface GlobeConfig {
  pointSize: number
  globeColor: string
  showAtmosphere: boolean
  atmosphereColor: string
  atmosphereAltitude: number
  emissive: string
  emissiveIntensity: number
  shininess: number
  polygonColor: string
  ambientLight: string
  directionalLeftLight: string
  directionalTopLight: string
  pointLight: string
  arcTime: number
  arcLength: number
  rings: number
  maxRings: number
  initialPosition: { lat: number; lng: number }
  autoRotate: boolean
  autoRotateSpeed: number
}

export function World({ data, globeConfig }: { data: ArcData[]; globeConfig: GlobeConfig }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0d1117)
    sceneRef.current = scene

    // Camera setup
    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    camera.position.z = 2.5
    cameraRef.current = camera

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Lighting
    const ambientLight = new THREE.AmbientLight(globeConfig.ambientLight, 0.8)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(globeConfig.directionalTopLight, 1)
    directionalLight.position.set(0, 1, 0.5)
    scene.add(directionalLight)

    // Create globe geometry
    const radius = 1
    const geometry = new THREE.IcosahedronGeometry(radius, 64)
    const material = new THREE.MeshPhongMaterial({
      color: globeConfig.globeColor,
      emissive: globeConfig.emissive,
      emissiveIntensity: globeConfig.emissiveIntensity,
      shininess: globeConfig.shininess,
      flatShading: false,
    })

    const globe = new THREE.Mesh(geometry, material)
    scene.add(globe)

    // Add some visual detail with wireframe overlay (subtle)
    const wireframeGeometry = new THREE.IcosahedronGeometry(radius + 0.01, 32)
    const wireframeMaterial = new THREE.MeshPhongMaterial({
      color: globeConfig.polygonColor,
      emissive: 0x000000,
      emissiveIntensity: 0,
      shininess: 0,
      wireframe: true,
      opacity: 0.1,
      transparent: true,
    })
    const wireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial)
    scene.add(wireframe)

    // Add atmosphere if enabled
    if (globeConfig.showAtmosphere) {
      const atmosphereGeometry = new THREE.IcosahedronGeometry(
        radius + globeConfig.atmosphereAltitude,
        32
      )
      const atmosphereMaterial = new THREE.MeshPhongMaterial({
        color: globeConfig.atmosphereColor,
        emissive: 0x000000,
        emissiveIntensity: 0,
        shininess: 0,
        transparent: true,
        opacity: 0.1,
      })
      const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial)
      scene.add(atmosphere)
    }

    // Convert lat/lng to 3D coordinates
    const latLngToVector3 = (lat: number, lng: number): THREE.Vector3 => {
      const phi = (90 - lat) * (Math.PI / 180)
      const theta = (lng + 180) * (Math.PI / 180)
      return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      )
    }

    // Create arc between two points
    const createArc = (
      start: THREE.Vector3,
      end: THREE.Vector3,
      color: string,
      altitudeFactor: number = 0.5
    ) => {
      const curve = new THREE.CatmullRomCurve3([
        start,
        start
          .clone()
          .add(end.clone().sub(start).multiplyScalar(0.5))
          .normalize()
          .multiplyScalar(radius + radius * altitudeFactor),
        end,
      ])

      const points = curve.getPoints(50)
      const geometry = new THREE.BufferGeometry().setFromPoints(points)
      const material = new THREE.LineBasicMaterial({
        color: new THREE.Color(color),
        linewidth: 2,
        transparent: true,
        opacity: 0.6,
      })

      return new THREE.Line(geometry, material)
    }

    // Add arcs
    data.forEach((arc) => {
      const start = latLngToVector3(arc.startLat, arc.startLng)
      const end = latLngToVector3(arc.endLat, arc.endLng)
      const arcLine = createArc(start, end, arc.color, arc.arcAlt)
      scene.add(arcLine)
    })

    // Add points at arc endpoints
    const pointGeometry = new THREE.SphereGeometry(globeConfig.pointSize / 500, 8, 8)
    const pointMaterial = new THREE.MeshStandardMaterial({
      color: globeConfig.pointLight,
      emissive: globeConfig.pointLight,
      emissiveIntensity: 2,
    })

    data.forEach((arc) => {
      const startPos = latLngToVector3(arc.startLat, arc.startLng)
      const endPos = latLngToVector3(arc.endLat, arc.endLng)

      const startPoint = new THREE.Mesh(pointGeometry, pointMaterial.clone())
      startPoint.position.copy(startPos)
      scene.add(startPoint)

      const endPoint = new THREE.Mesh(pointGeometry, pointMaterial.clone())
      endPoint.position.copy(endPos)
      scene.add(endPoint)
    })

    // Set initial rotation based on position
    const initialLat = globeConfig.initialPosition.lat
    const initialLng = globeConfig.initialPosition.lng
    globe.rotation.y = (initialLng * Math.PI) / 180
    globe.rotation.x = -(initialLat * Math.PI) / 180

    // Animation loop
    let animationId: number
    const animate = () => {
      animationId = requestAnimationFrame(animate)

      // Auto-rotate if enabled
      if (globeConfig.autoRotate) {
        globe.rotation.y += globeConfig.autoRotateSpeed * 0.001
        wireframe.rotation.copy(globe.rotation)
      }

      renderer.render(scene, camera)
    }

    animate()

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return
      const newWidth = containerRef.current.clientWidth
      const newHeight = containerRef.current.clientHeight
      camera.aspect = newWidth / newHeight
      camera.updateProjectionMatrix()
      renderer.setSize(newWidth, newHeight)
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationId)
      renderer.dispose()
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement)
      }
    }
  }, [data, globeConfig])

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}