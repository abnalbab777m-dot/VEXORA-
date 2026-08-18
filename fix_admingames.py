import re

with open('src/pages/admin/AdminGames.tsx', 'r') as f:
    c = f.read()

target1 = """  const toggleStatus = async (gameId: string, currentStatus: string) => {
    setUpdating(gameId);"""
replacement1 = """  const toggleStatus = async (gameId: string, currentStatus: string) => {
    if (!confirm(`Are you sure you want to change this game's status?`)) return;
    setUpdating(gameId);"""
c = c.replace(target1, replacement1)

target2 = """  const toggleMatchmaking = async (gameId: string, currentEnabled: boolean) => {
    setUpdating(gameId);"""
replacement2 = """  const toggleMatchmaking = async (gameId: string, currentEnabled: boolean) => {
    if (!confirm(`Are you sure you want to toggle matchmaking for this game?`)) return;
    setUpdating(gameId);"""
c = c.replace(target2, replacement2)

with open('src/pages/admin/AdminGames.tsx', 'w') as f:
    f.write(c)
