import Box from '@mui/material/Box'
import ListColumns from './ListColumns/ListColumns'
import { mapOrder } from '~/utils/sorts'

import {
  DndContext,
  PointerSensor,
  useSensor,
  MouseSensor,
  TouchSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  closestCorners,
  pointerWithin,
  getFirstCollision
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useEffect, useState, useCallback, useRef } from 'react'
import { cloneDeep, isEmpty } from 'lodash'

import Column from './ListColumns/Column/Column'
import Card from './ListColumns/Column/ListCards/Card/Card'

import { generatePlaceholderCard } from '~/utils/formatters'

const ACTIVE_DRAG_ITEM_TYPE = {
  COLUMN: 'ACTIVE_DRAG_ITEM_TYPE_COLUMN',
  CARD: 'ACTIVE_DRAG_ITEM_TYPE_CARD'
}

function BoardContent({ board }) {
  // https://docs.dndkit.com/api-documentation/sensors
  const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 10 } })

  // Yêu cầu dùng chuột di chuyển 10px thì mới kích hoạt
  const mouseSensor = useSensor(MouseSensor, { activationConstraint: { distance: 10 } })
  // Yêu cầu nhấn giữ 250ms và dung sai cảm ứng 500px thì mới kích hoạt
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 500 } })

  // Ưu tiên dùng mouse và touch để trải nghiệm mobile tốt nhất, không dính bug
  // const sensors = useSensors(pointerSensor)
  const sensors = useSensors(mouseSensor, touchSensor)


  const [orderedColumns, setOrderedColumns] = useState([])
  // Cùng 1 thời điểm có một phần tử được kéo (column hoặc card)
  const [activeDragItemId, setActiveDragItemId] = useState(null)
  const [activeDragItemType, setActiveDragItemType] = useState(null)
  const [activeDragItemData, setActiveDragItemData] = useState(null)
  const [oldColumnWhenDraggingCard, setOldColumnWhenDraggingCard] = useState(null)

  // điểm va chạm cuối cùng xử lý thuật toán
  const lastOverId = useRef(null)

  useEffect(() => {
    setOrderedColumns(mapOrder(board?.columns, board.columnOrderIds, '_id'))
  }, [board])

  // Tìm 1 cái column theo cardId
  const findColumnByCardId = (cardId) => {
    return orderedColumns.find(column => column?.cards?.map(card => card._id)?.includes(cardId))
  }

  //fuction chung xử lý việc cập nhật chuẩn các columns
  const moveCardBetweenDifferentColumns = (
    overColumn,
    overCardId,
    active,
    over,
    activeColumn,
    activeDraggingCardId,
    activeDraggingCardData
  ) => {
    setOrderedColumns(prevColumns => {
      // Tìm vị trí Index của cái overCard trong Column nơi mà activeCard dc thả
      const overCardIndex = overColumn?.cards?.findIndex(card => card._id === overCardId)

      //Logic tính toán cho cardIndex mới (trên hoăc dưới overCard) lấy chuẩn ra từ code của thư viện.
      let newCardIndex
      const isBelowOverItem = active.rect.current.translated &&
        active.rect.current.translated.top > over.rect.top + over.rect.height
      const modifier = isBelowOverItem ? 1 : 0
      newCardIndex = overCardIndex >= 0 ? overCardIndex + modifier : overColumn?.cards?.length + 1

      //Clone mảng orderedColumnsState cũ ra mới rổi xử lý data rồi return - cập nhật lại orderedColumnsState
      const nextColumns = cloneDeep(prevColumns)
      const nextActiveColumn = nextColumns.find(column => column._id === activeColumn._id)
      const nextOverColumn = nextColumns.find(column => column._id === overColumn._id)

      // nextActiveColumn: column cũ
      if (nextActiveColumn) {
        // Xóa card ở column active, cái lúc kéo card ra khỏi nó chuyển sang column khác
        nextActiveColumn.cards = nextActiveColumn.cards.filter(card => card._id !== activeDraggingCardId)

        // Thêm PlaceholderCard nếu Column bị kéo hết card đi không còn cái nào
        if (isEmpty(nextActiveColumn.cards)) {
          nextActiveColumn.cards = [generatePlaceholderCard(nextActiveColumn)]
        }

        // Cập nhật lại mảng cardOrderIds cho chuẩn dữ liệu
        nextActiveColumn.cardOrderIds = nextActiveColumn.cards.map(card => card._id)
      }
      // nextOverColumn: column mới
      if (nextOverColumn) {
        // Kiểm tra xem card đang kéo có tồn tại ở overColumn chưa, có thì phải xóa
        nextOverColumn.cards = nextOverColumn.cards.filter(card => card._id !== activeDraggingCardId)

        // Đối với trường hợp dragEnd thì phải cập nhật lại cho chuẩn dữ liệu columnId trong card sau khi kéo giữa 2 column khác nhau.
        const rebuild_activeDraggingCardData = {
          ...activeDraggingCardData,
          columnId: nextOverColumn._id
        }
        // Bước tiếp theo là thêm cái card đang kéo vào overColumn ch theo vị trí Index mới
        nextOverColumn.cards = nextOverColumn.cards.toSpliced(
          newCardIndex,
          0,
          rebuild_activeDraggingCardData
        )

        // xóa cái PlaceholderCard đi nếu đang tồn tại
        nextOverColumn.cards = nextOverColumn.cards.filter(card => !card.FE_PlaceholderCard)

        // Cập nhật lại mảng cardOrderIds cho chuẩn dữ liệu
        nextOverColumn.cardOrderIds = nextOverColumn.cards.map(card => card._id)
      }

      // console.log('nextColumns:', nextColumns)
      return nextColumns
    })
  }

  // Trigger khi bắt đầu kéo 1 phần tử 
  const handleDragStart = (event) => {
    // console.log('handleDragStart: ', event)
    setActiveDragItemId(event?.active?.id)
    setActiveDragItemType(event?.active?.data?.current?.columnId ? ACTIVE_DRAG_ITEM_TYPE.CARD : ACTIVE_DRAG_ITEM_TYPE.COLUMN)
    setActiveDragItemData(event?.active?.data?.current)

    //Nếu là kéo card thì mới thực hiện những hành động giá trị oldColumn
    if (event?.active?.data?.current?.columnId) {
      setOldColumnWhenDraggingCard(findColumnByCardId(event?.active?.id))
    }
  }

  //Trigger trong quá trình kéo một phần tử
  const handleDragOver = (event) => {
    // console.log('handleDragOver: ')
    // Không làm gì thêm khi kéo column
    if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) return

    //Còn nếu kéo card thì xử lý thêm để có thể kéo card qua các columns
    const { active, over } = event

    //Cần đảm bảo nếu không tồn tại active hoặc over (kéo linh tinh ra ngoài thì return luôn tránh lỗi)
    if (!active || !over) return

    // activeDraggingCard: là Card đang kéo
    const { id: activeDraggingCardId, data: { current: activeDraggingCardData } } = active
    // là Card tương tác trên hoặc dưới so với card đươc kéo
    const { id: overCardId } = over
    //Tìm 2 column theo CardId
    const activeColumn = findColumnByCardId(activeDraggingCardId)
    const overColumn = findColumnByCardId(overCardId)
    // console.log('activeColumn: ', activeColumn)
    // console.log('overColumn: ', overColumn)

    //Nếu không tồn tại 1 trong 2 thì crash website
    if (!activeColumn || !overColumn) return
    // Xử lý logic ở đây chỉ kéo card qua 2 column khác nhau, còn nếu kéo card trong chính column ban đầu thì nó ko làm gì
    // Vì ở đây xử lý lúc kéo (handleDragOver), còn xử lý kéo xong xuôi thì nó lại là vấn đề khác ở đây (handleDragEnd)
    if (activeColumn._id !== overColumn._id) {
      moveCardBetweenDifferentColumns(
        overColumn,
        overCardId,
        active,
        over,
        activeColumn,
        activeDraggingCardId,
        activeDraggingCardData
      )
    }
  }

  // Trigger khi kết thúc kéo 1 phần tử = drop thả
  const handleDragEnd = (event) => {
    // console.log('handleDragEnd: ', event)
    const { active, over } = event

    //Cần đảm bảo nếu không tồn tại active hoặc over (kéo linh tinh ra ngoài thì return luôn tránh lỗi)
    if (!active || !over) return

    //Xử lý kéo thả card
    if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.CARD) {
      // console.log('Hành động kéo thả card - tạm thời không làm gì')
      // activeDraggingCard: là Card đang kéo
      const { id: activeDraggingCardId, data: { current: activeDraggingCardData } } = active
      // là Card tương tác trên hoặc dưới so với card đươc kéo
      const { id: overCardId } = over
      //Tìm 2 column theo CardId
      const activeColumn = findColumnByCardId(activeDraggingCardId)
      const overColumn = findColumnByCardId(overCardId)
      // console.log('activeColumn: ', activeColumn)
      // console.log('overColumn: ', overColumn)

      //Nếu không tồn tại 1 trong 2 thì crash website
      if (!activeColumn || !overColumn) return

      // Phải dùng tới activeDragItemData.columnId & oldColumnDraggingCard._id (set vào state từ bước handleDragStart)
      // chứ không phải activeData trong scope handleDragEnd
      // này vì sau khi đi qua onDragOver tới đây là state của card đã bị cập nhật một lần rồi
      // console.log('oldColumnWhenDraggingCard: ', oldColumnWhenDraggingCard)
      if (oldColumnWhenDraggingCard._id !== overColumn._id) {
        moveCardBetweenDifferentColumns(
          overColumn,
          overCardId,
          active,
          over,
          activeColumn,
          activeDraggingCardId,
          activeDraggingCardData
        )
      } else {

        // Hanh dong keo tha card trong cung 1 column

        //lấy vị trí cũ của active
        const oldCardIndex = oldColumnWhenDraggingCard?.cards?.findIndex(c => c._id === activeDragItemId)
        //lấy vị trí mới của over
        const newCardIndex = overColumn?.cards?.findIndex(c => c._id === overCardId)
        // Dùng arraymove vì keo card trong 1 cai column thi tuong tu logic
        // keo column trong boardcontent
        const dndOrderedCards = arrayMove(oldColumnWhenDraggingCard?.cards, oldCardIndex, newCardIndex)

        setOrderedColumns(prevColumns => {
          //Clone mảng orderedColumnsState cũ ra mới rổi xử lý data rồi return - cập nhật lại orderedColumnsState
          const nextColumns = cloneDeep(prevColumns)

          // Tìm tới column mà ta đang thả
          const targetColumn = nextColumns.find(column => column._id === overColumn._id)
          targetColumn.cards = dndOrderedCards
          targetColumn.cardOrderIds = dndOrderedCards.map(card => card._id)

          return nextColumns
        })
      }
    }

    //Xử lý kéo thả column
    if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) {
      // console.log('Hành động kéo thả column - tạm thời không làm gì')

      //Nếu vị trí sau khi kéo thả khác với vị trí ban đầu
      if (active.id !== over.id) {
        //lấy vị trí cũ của active
        const oldColumnIndex = orderedColumns.findIndex(c => c._id === active.id)
        //lấy vị trí mới của over
        const newColumnIndex = orderedColumns.findIndex(c => c._id === over.id)

        const dndOrderedColumns = arrayMove(orderedColumns, oldColumnIndex, newColumnIndex)
        // const dndOrderedColumnsIds = dndOrderedColumns.map(c => c._id)
        // console.log('dndOrderedColumns: ', dndOrderedColumns)
        // console.log('dndOrderedColumnsIds: ', dndOrderedColumnsIds)

        //Cập nhật lại state columns ban đầu sau khi đã kéo thả
        setOrderedColumns(dndOrderedColumns)
      }
    }

    // Những dữ liệu sau khi kéo thả
    setActiveDragItemId(null)
    setActiveDragItemType(null)
    setActiveDragItemData(null)
    setOldColumnWhenDraggingCard(null)
  }
  // console.log('activeDragItemId: ', activeDragItemId)
  // console.log('setActiveDragItemType: ', activeDragItemType)
  // console.log('setActiveDragItemData: ', activeDragItemData)
  const customDropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: { active: { opacity: '0.5' } }
    })
  }
  // args = arguments = các đối số, tham số
  const collisionDetectionStrategy = useCallback((args) => {
    // console.log('collisionDetectionStrategy')
    // Trường hợp kéo column thì thuật toán closetCorners là chuẩn nhất
    if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) {
      return closestCorners({ ...args })
    }

    //tìm các điểm va chạm = intersections với con trỏ
    const pointerIntersections = pointerWithin(args)
    // console.log('pointerIntersections', pointerIntersections)

    //Fix triệt để flickering
    //kéo một cái ảnh to ra khỏi khu vực kéo thả
    if (!pointerIntersections?.length) return

    //thuật toán phát hiện va chạm trả về một mảng chứa các va chạm (không cần bước này nữa)
    // const intersections = !!pointerIntersections?.length
    //   ? pointerIntersections
    //   : rectIntersection(args)

    // console.log('intersections', intersections)
    // tìm overId đầu tiên trong đám pointerIntersections ở trên
    let overId = getFirstCollision(pointerIntersections, 'id')

    // console.log('overId', overId)
    if (overId) {
      // fix Flickering
      const checkColumn = orderedColumns.find(column => column._id === overId)
      if (checkColumn) {
        // console.log('overId before', overId)
        overId = closestCorners({
          ...args,
          droppableContainers: args.droppableContainers.filter(container => {
            return (container.id !== overId) && (checkColumn?.cardOrderIds?.includes(container.id))
          })
        })[0]?.id
        // console.log('overId after', overId)
      }

      lastOverId.current = overId
      return [{ id: overId }]
    }
    // Nếu overId là null thì trả về mảng - tránh bug crash trang
    return lastOverId.current ? [{ id: lastOverId.current }] : []
  }, [activeDragItemType, orderedColumns])

  return (
    <DndContext
      sensors={sensors}
      // Thuật toán phát hiện va chạm
      // Nếu chỉ dùng ClosetConers sẽ có bug Flickering.
      //https://docs.dndkit.com/api-documentation/context-provider/collision-detection-algorithms
      // collisionDetection={closestCorners}
      collisionDetection={collisionDetectionStrategy}


      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <Box sx={{
        bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#34495e' : '#1976d2'),
        width: '100%',
        height: (theme) => theme.trello.boardContentHeight,
        p: '10px 0'
      }}>
        <ListColumns columns={orderedColumns} />
        <DragOverlay dropAnimation={customDropAnimation}>
          {(!activeDragItemType) && null}
          {(activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) && <Column column={activeDragItemData} />}
          {(activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.CARD) && <Card card={activeDragItemData} />}
        </DragOverlay>
      </Box>
    </DndContext>
  )
}

export default BoardContent