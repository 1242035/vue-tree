const pinyin = require('chinese-to-pinyin')
export default class TreeStore {
  constructor (options) {
    for (let option in options) {
      if (options.hasOwnProperty(option)) {
        this[option] = options[option]
      }
    }
    this.datas = new Map()
    const _traverseNodes = (root) => {
      for (let node of root) {
        this.datas.set(node.id, node)
        if (node.children && node.children.length > 0) _traverseNodes(node.children)
      }
    }
    _traverseNodes(this.root)
  }

  changeCheckStatus (node) {
    const _traverseUp = (node) => {
      if (node.checked && node.parentId) {
        let parent = this.getNode(node.parentId)
        parent.checked = this.sameSilibingChecked(node.parentId, node.id)
        _traverseUp(parent)
      } else {
        if (!node.checked && node.parentId) {
          let upparent = this.getNode(node.parentId)
          upparent.checked = false
          if (upparent.parentId) {
            _traverseUp(upparent)
          }
        }
      }
    }

    const _traverseDown = (node) => {
      if (node.children && node.children.length > 0) {
        for (let child of node.children) {
          child.checked = node.checked
          _traverseDown(child)
        }
      }
    }
    _traverseUp(node)
    _traverseDown(node)
  }
    changeCheckHalfStatus(node) {
        let flag = false;
        //�����ѡ�����ӽڵ㣬���ڵ�Ĭ�ϴ��Ϲ�
        const _traverseUp = (node, flag) => {
            let parent = null;
            if (node.checked) { //��
                if (node.parentId) {
                    parent = this.getNode(node.parentId)
                    if (flag) {
                        parent.checked = true
                        parent.nodeSelectNotAll = true
                        _traverseUp(parent, true)
                    } else {
                        parent.checked = true;
                        parent.nodeSelectNotAll = this.sameSilibingHalfChecked(true, parent, node.parentId, node.id) === 'half' ? true : false; //����true��ȫ����falseΪ�빳
                        _traverseUp(parent)
                    }
                }
            } else { //ȥ��
                if (node.parentId) {
                    parent = this.getNode(node.parentId)
                    if (this.sameSilibingHalfChecked(false, parent, node.parentId, node.id) === "none") { //����true��ȫû����falseΪ�빳
                        parent.checked = false
                        parent.nodeSelectNotAll = false
                    } else {
                        parent.checked = true
                        parent.nodeSelectNotAll = true
                    }
                    _traverseUp(parent, true)
                }
            }
        }
        const _traverseDown = (node) => {
            if (node.children && node.children.length > 0) {
                if (node.nodeSelectNotAll) { //�ڵ�û��ѡ
                    node.nodeSelectNotAll = false
                }
                for (let child of node.children) {
                    child.checked = node.checked
                    _traverseDown(child)
                }
            }
        }
        _traverseUp(node)
        _traverseDown(node)
    }
    sameSilibingChecked(parentId, currentId) {
        let parent = this.datas.get(parentId)
        let sbIds = []
        parent.children.forEach(x => {
            if (x.id !== currentId) sbIds.push(x.id)
        })
        for (let id of sbIds) {
            let node = this.getNode(id)
            if (!node.checked) return false
        }
        return true
    }
    sameSilibingHalfChecked(status, parent, parentId, currentId) {
        let sbIds = []
        parent.children.forEach(x => {
            if (x.id !== currentId) sbIds.push(x.id) //��ȥ��ǰ�ڵ��ʣ�½ڵ�
        })
        if (status) { //��
            if (sbIds.length !== 0) {
                for (let id of sbIds) { //�ӽڵ�ֻҪ��һ����ѡ���򸸿��ڣ�ȫѡ�򹳣�ȫû�б�ѡ��״̬
                    let node = this.getNode(id)
                    if (!node.checked || node.nodeSelectNotAll) { //�ڵ�û��ѡ
                        return "half" //��ʾ����빳��״̬
                    }
                }
            } else {
                let currentNode = this.getNode(currentId)
                if (currentNode.nodeSelectNotAll) {
                    return "half" //��ʾ�빳��״̬
                }
            }
            return "all" //��ʾȫ����״̬
        } else { //ȥ��
            if (sbIds.length !== 0) {
                for (let id of sbIds) { //�ӽڵ�ֻҪ��һ����ѡ���򸸿��ڣ�ȫѡ�򹳣�ȫû�б�ѡ��״̬
                    let node = this.getNode(id)
                    if (node.checked || node.nodeSelectNotAll) { //�нڵ㱻��ѡ������빳��״̬
                        return "half"
                    }
                }
            } else {
                let currentNode = this.getNode(currentId)
                if (currentNode.nodeSelectNotAll) {
                    return "half" //��ʾ�빳��״̬
                }
            }
            return "none"
        }
    }
    isExitParent(parent) {
        if (parent.id) {
            return this.getNode(node.parentId)
        }
        return null
    }
  isNullOrEmpty (world) {
    if (world) {
      return world.trim().length === 0
    }
    return true
  }
  filterNodes (keyworld, searchOptions) {
    const _filterNode = (val, node) => {
      if (!val) return true
      if (searchOptions.useEnglish) {
        return node.label.indexOf(val) !== -1
      } else {
        return this.toPinYin(node.label, searchOptions.useInitial).indexOf(this.toPinYin(keyworld.toLowerCase(), searchOptions.useInitial, true)) !== -1
      }
    }

    const _syncNodeStatus = (node) => {
      if (node.parentId) {
        let parentNode = this.getNode(node.parentId)
        if (node.visible) {
          parentNode.visible = node.visible
          _syncNodeStatus(parentNode)
        }
      }
    }
    let filterFunc = (searchOptions.customFilter && typeof (searchOptions.customFilter) === 'function') ? searchOptions.customFilter : _filterNode
    this.datas.forEach(node => {
      node.visible = filterFunc(keyworld, node)
      node.searched = false
      if (node.visible) {
        if (!this.isNullOrEmpty(keyworld)) {
          node.searched = true
        }
        _syncNodeStatus(node)
      }
    })
  }
  getNode (key) {
    return this.datas.get(key)
  }
  toPinYin (keyworld, useInitial) {
    if (/^[a-zA-Z]/.test(keyworld)) {
      return keyworld
    }
    let fullpinyin = pinyin(keyworld, {
      filterChinese: true,
      noTone: true
    })
    if (useInitial) {
      let res = ''
      fullpinyin.split(' ').forEach(w => {
        if (!(/[a-zA-Z]/.test(w))) {
          res += w
        } else {
          res += w.slice(0, 1)
        }
      })
      return res
        }
        return fullpinyin
  }
}
