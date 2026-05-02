export interface GitBranchInfo {
  branch: string
  isDirty: boolean
}

export function getGitStatus(vcs?: { branch?: string }): GitBranchInfo | null {
  if (!vcs?.branch) return null
  return {
    branch: vcs.branch,
    isDirty: true,
  }
}