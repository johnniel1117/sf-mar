'use client'

import { SavedManifestsTab } from '@/components/tabs/SavedManifestTab'
import type { TripManifest } from '@/lib/services/tripManifestService'

export default function SavedManifestPage() {
  return (
    <SavedManifestsTab
      savedManifests={[]}
      handleViewManifest={() => {}}
      handleEditManifest={() => {}}
      handleDownloadManifest={() => {}}
      handleDeleteManifest={() => {}}
    />
  )
}