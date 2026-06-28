import { useAppStore } from '../stores/app.store'
import type { Group } from '../types'

export const groupService = {
  getGroups: (): Promise<Group[]> => {
    // TODO: replace with fetch GET /api/groups
    return Promise.resolve(useAppStore.getState().groups)
  },

  getGroup: (groupId: string): Promise<Group | undefined> => {
    // TODO: replace with fetch GET /api/groups/:id
    return Promise.resolve(useAppStore.getState().groups.find((g) => g.id === groupId))
  },
}
