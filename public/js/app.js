var Page = React.createClass({
  search: function(query, options) {
    var url = this.props.url
    if (!!options) {
      options.forEach(function(el, index, arr) {
        url += '&' + el
      })
    }
    $.ajax({
      url: url,
      type: 'POST',
      data: query,
      dataType: 'json',
      success: function(data) {
        this.setState({data: data})
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString())
      }.bind(this)
    })
  },
  getInitialState: function() {
    return {data: []}
  },
  componentDidMount: function() {
    this.search({})
  },
  render: function() {
    return (
      <div className='Page'>
        <NoBetNavbar />
        <SearchBox onSubmit={this.search}/>
        <RecordList data={this.state.data} />
      </div>
    )
  }
})

var SearchBox = React.createClass({
  onFutureCheckedChange: function() {
    var isChecked = !this.state.isFutureChecked
    this.setState({ isFutureChecked: isChecked })
  },
  onClickSortByDate: function(e) {
    this.setState({
      isSortedByDate: e.target.value,
      isSortedByROI: !e.target.value
    })
  },
  onClickSortByROI: function(e) {
    this.setState({
      isSortedByDate: !e.target.value,
      isSortedByROI: e.target.value
    })
  },
  handleSubmit: function(e) {
    if (!!e) {
      e.preventDefault()
    }
    var text = this.refs.searchText.getDOMNode().value
    var queries = text.split(/[ \t]+/).map(function(query) {
      return '{"BetItem.Teams.Name":{"$regex": "' + query + '", "$options" : "imsx"}}'
    })
    var combinedQuery = '{"$or": ['
    var count = 0
    queries.forEach(function(query) {
      if (count > 0) {
        combinedQuery += ','
      }
      combinedQuery += query
      count++
    })
    combinedQuery += ']}'
    if (this.state.isFutureChecked) {
      combinedQuery = '{"$and":[' + combinedQuery + ', {"$or":[{"BetItem.Result":{"$exists":false}}, {"BetItem.Result":"Unknown"}]}]}'
    }

    var options = []
    if (this.state.isSortedByDate) {
      options.push('orderby=BetItem.MatchDate')
      options.push('desc=1')
    }
    else if (this.state.isSortedByROI) {
      options.push('orderby=ROI')
      options.push('desc=1')
    }

    this.props.onSubmit(combinedQuery, options)
  },
  getInitialState: function() {
    return {
      isChecked: false,
      isSortedByDate: false,
      isSortedByROI: false
      }
  },
  render: function() {
    return (
      <div className='SearchBox'>
        <form className='SearchBoxForm' onSubmit={this.handleSubmit}>
          <label className='aria-label'>What to search?</label>
          <div className="input-group input-group-lg">
            <input type='text' className='SearchText form-control' placeholder='search all' maxLength='128' ref='searchText' />
            <span className='input-group-btn'>
              <button className='btn btn-default' type='button' onClick={this.handleSubmit}>Search</button>
            </span>
          </div>
          <div className='checkbox'>
            <label>
              <input type='checkbox' ref='showFutureOnly' checked={this.state.isFutureChecked} onChange={this.onFutureCheckedChange}> Future Only</input>
            </label>
          </div>
          <div className='radios'>
            <label>
              <input type='radio' id='sortByDate' ref='sortByDate' checked={this.state.isSortedByDate} onChange={this.onClickSortByDate}> Sort By Date</input>
            </label>
            <label>
              <input type='radio' id='sortByROI' ref='sortByROI' checked={this.state.isSortedByROI} onChange={this.onClickSortByROI}> Sort By ROI</input>
            </label>
          </div>
        </form>
      </div>
    )
  }
})

var Table = ReactBootstrap.Table
var thead = ReactBootstrap.thead
var tr = ReactBootstrap.tr
var td = ReactBootstrap.td
var tbody = ReactBootstrap.tbody

var RecordList = React.createClass({
  render: function() {
    var recordNodes = this.props.data.map(function (record) {
      return (
        <Record key={record._id} data={record} />
      )
    })
    return (
      <Table responsive className='RecordList'>
        <thead>
          <tr>
            <th>Team 1</th>
            <th>Team 2</th>
            <th>Smart Choice</th>
            <th>Actual Result</th>
            <th>Match Time</th>
            <th>Odds</th>
            <th>Odds Time</th>
            <th>Bookmaker</th>
            <th>Predicted ROI</th>
          </tr>
        </thead>
        <tbody>
          {recordNodes}
        </tbody>
      </Table>
    )
  }
})

var Record = React.createClass({
  render: function() {
    var betItem = this.props.data.BetItem
    var decision = this.props.data.Decision
    var ROI = this.props.data.ROI
    var result = 'Unknown'
    var localMatchTime = new Date(betItem.MatchDate).toLocaleString()
    var localOddsTime = new Date(betItem.OddsDate).toLocaleString()
    if (typeof this.props.data.BetItem.Result != 'undefined') {
      result = this.props.data.BetItem.Result
    }
    return (
      <tr className='Record'>
        <td><b>{betItem.Teams[0].Name.replace(/_/g, ' ')}</b></td>
        <td><b>{betItem.Teams[1].Name.replace(/_/g, ' ')}</b></td>
        <td><b>{decision}</b></td>
        <td><b>{result}</b></td>
        <td>{localMatchTime}</td>
        <td>{betItem.Odds.Win} / {betItem.Odds.Draw} / {betItem.Odds.Lose}</td>
        <td>{localOddsTime}</td>
        <td>{betItem.BookMaker}</td>
        <td>{toPercent(ROI)}</td>
      </tr>
    )
  }
})

var Navbar = ReactBootstrap.Navbar
var Nav = ReactBootstrap.Nav
var NavItem = ReactBootstrap.NavItem
var CollapsableNav = ReactBootstrap.CollapsableNav

var NoBetNavbar = React.createClass({
  render: function() {
    return (
      <Navbar brand='NoBet' toggleNavKey={0}>
        <CollapsableNav eventKey={0}> {/* This is the eventKey referenced */}
          <Nav navbar right>
            <NavItem eventKey={1} href='#'>About</NavItem>
            <NavItem eventKey={2} href='#'>Quit</NavItem>
          </Nav>
        </CollapsableNav>
      </Navbar>
    )
  }
})

React.render(
  <Page url='/records?1=1'/>,
  document.getElementById('container')
)
