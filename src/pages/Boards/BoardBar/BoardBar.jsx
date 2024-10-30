import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import DashboardIcon from '@mui/icons-material/Dashboard'
import VpnLockIcon from '@mui/icons-material/VpnLock'
import AddToDriveIcon from '@mui/icons-material/AddToDrive'
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt'
import FilterListIcon from '@mui/icons-material/FilterList'
import Avatar from '@mui/material/Avatar'
import AvatarGroup from '@mui/material/AvatarGroup'
import Tooltip from '@mui/material/Tooltip'
import Button from '@mui/material/Button'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import { capitalizeFirstLetter } from '~/utils/formatters'

const MENU_STYLES = {
  color: 'white',
  bgcolor: 'transparent',
  border: 'none',
  paddingX: '5px',
  borderRadius: '4px',
  '.MuiSvgIcon-root': {
    color: 'white'
  },
  '&:hover': {
    bgcolor: 'primary.50'
  }
}


function BoardBar({ board }) {
  return (
    <Box sx={{
      width: '100%',
      height: (theme) => theme.trello.boardBarHeight,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 2,
      paddingX: 2,
      overflowX: 'auto',
      bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#34495e' : '#1976d2'),
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Chip
          sx={MENU_STYLES}
          icon={<DashboardIcon />}
          label={board?.title}
          clickable
        // onClick={() => { }}
        />
        <Chip
          sx={MENU_STYLES}
          icon={<VpnLockIcon />}
          label={capitalizeFirstLetter(board?.type)}
          // clickable
          onClick={() => { }}
        />
        <Chip
          sx={MENU_STYLES}
          icon={<AddToDriveIcon />}
          label="Add to Google Drive"
          // clickable
          onClick={() => { }}
        />
        <Chip
          sx={MENU_STYLES}
          icon={<ElectricBoltIcon />}
          label="Automation"
          // clickable
          onClick={() => { }}
        />
        <Chip
          sx={MENU_STYLES}
          icon={<FilterListIcon />}
          label="Filters"
          // clickable
          onClick={() => { }}
        />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<PersonAddIcon />}
          sx={{
            color: 'white',
            borderColor: 'white',
            '&:hover': { borderColor: 'white' }
          }}
        >
          Invite
        </Button>

        <AvatarGroup
          max={4}
          sx={{
            gap: '10px',
            '& .MuiAvatar-root': {
              width: 34,
              height: 34,
              fontSize: 16,
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              '&:first-of-type': { bgcolor: '#a4b0be' }
            }
          }}
        >
          <Tooltip title="MinhNgocDev">
            <Avatar
              alt="MinhNgocDev"
              src="https://scontent.fsgn2-7.fna.fbcdn.net/v/t39.30808-6/442416302_2139069186456302_2455067577286298916_n.jpg?_nc_cat=100&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=Lrrp06Xl4MYQ7kNvgFiHF_Y&_nc_ht=scontent.fsgn2-7.fna&oh=00_AYCEieKShmYKI1ZblZiQbqUyu5FXnUHYsi9u_z-HSAicpQ&oe=66A671B2"
            />
          </Tooltip>
          <Tooltip title="MinhNgocDev">
            <Avatar
              alt="MinhNgocDev"
              src=""
            />
          </Tooltip>
          <Tooltip title="MinhNgocDev">
            <Avatar
              alt="MinhNgocDev"
              src=""
            />
          </Tooltip>
          <Tooltip title="MinhNgocDev">
            <Avatar
              alt="MinhNgocDev"
              src=""
            />
          </Tooltip>
          <Tooltip title="MinhNgocDev">
            <Avatar
              alt="MinhNgocDev"
              src=""
            />
          </Tooltip>
          <Tooltip title="MinhNgocDev">
            <Avatar
              alt="MinhNgocDev"
              src=""
            />
          </Tooltip>
          <Tooltip title="MinhNgocDev">
            <Avatar
              alt="MinhNgocDev"
              src=""
            />
          </Tooltip>
        </AvatarGroup>
      </Box>
    </Box>
  )
}

export default BoardBar