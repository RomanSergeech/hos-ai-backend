

export const getUserDto = ( user: any ): any => {
  return {
    login: user.login,
    role: user.role,
  }
}
