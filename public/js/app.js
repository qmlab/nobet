var Navbar = ReactBootstrap.Navbar
var Nav = ReactBootstrap.Nav
var NavItem = ReactBootstrap.NavItem
var CollapsableNav = ReactBootstrap.CollapsableNav
var Grid = ReactBootstrap.Grid
var Row = ReactBootstrap.Row
var Col = ReactBootstrap.Col
var Panel = ReactBootstrap.Panel
var PanelGroup = ReactBootstrap.PanelGroup
var Well = ReactBootstrap.Well

var Table = ReactBootstrap.Table
var thead = ReactBootstrap.thead
var tr = ReactBootstrap.tr
var td = ReactBootstrap.td
var tbody = ReactBootstrap.tbody

var SearchPage = React.createClass({
  search: function(query, options) {
    var url = this.props.url + 'records?1=1'
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
              <input type='radio' id='sortByDate' ref='sortByDate' checked={this.state.isSortedByDate} onChange={this.onClickSortByDate}> Sort By Date </input>
            </label>
            <label>
              <input type='radio' id='sortByROI' ref='sortByROI' checked={this.state.isSortedByROI} onChange={this.onClickSortByROI}> Sort By Confidence </input>
            </label>
          </div>
        </form>
      </div>
    )
  }
})

var RecordList = React.createClass({
  render: function() {
    var recordNodes = this.props.data.map(function (record) {
      return (
        <Record key={record._id} data={record} />
      )
    })
    return (
      <Table striped condensed responsive className='RecordList'>
        <thead>
          <tr>
            <th>Home Team</th>
            <th>Away Team</th>
            <th>NoBet Choice</th>
            <th>Real Result</th>
            <th><strong>Confidence</strong></th>
            <th>Match Time</th>
            <th>Odds</th>
            <th>Odds Time</th>
            <th>Bookmaker</th>
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
    var roi = toPercent(this.props.data.ROI)
    var result = 'Unknown'
    var localMatchTime = new Date(betItem.MatchDate).toLocaleString()
    var localOddsTime = new Date(betItem.OddsDate).toLocaleString()
    if (typeof this.props.data.BetItem.Result != 'undefined') {
      result = this.props.data.BetItem.Result
    }
    var roiClass = 'normalLvl'
    if (this.props.data.ROI >= 0.2) {
      roiClass = 'excellentLvl'
    }
    else if (this.props.data.ROI >= 0.1) {
      roiClass = 'veryGoodLvl'
    }
    else if (this.props.data.ROI >= 0.05) {
      roiClass = 'goodLvl'
    }
    else if (this.props.data.ROI >= 0.02) {
      roiClass = 'fairLvl'
    }
    else if (this.props.data.ROI < 0) {
      roiClass = 'poorLvl'
    }

    return (
      <tr className='Record'>
        <td>{betItem.Teams[0].Name.replace(/_/g, ' ')}</td>
        <td>{betItem.Teams[1].Name.replace(/_/g, ' ')}</td>
        <td><strong>{decision}</strong></td>
        <td><strong>{result}</strong></td>
        <td className={roiClass}><strong>{roi}</strong></td>
        <td>{localMatchTime}</td>
        <td>{betItem.Odds.Win} / {betItem.Odds.Draw} / {betItem.Odds.Lose}</td>
        <td>{localOddsTime}</td>
        <td>{betItem.BookMaker}</td>
      </tr>
    )
  }
})

var NoBetNavbar = React.createClass({
  onClickSearch: function(e) {
    if (!!e) {
      e.preventDefault()
    }
    React.render(
      <SearchPage url='/'/>,
      document.getElementById('pageContainer')
    )
  },
  onClickStatistics: function(e) {
    if (!!e) {
      e.preventDefault()
    }
    React.render(
      <StatisticsPage url='/'/>,
      document.getElementById('pageContainer')
    )
  },
  render: function() {
    return (
      <Navbar brand='NoBet' toggleNavKey={0}>
        <CollapsableNav eventKey={0}> {/* This is the eventKey referenced */}
          <Nav navbar right>
            <NavItem eventKey={1} href='#' onClick={this.onClickSearch}>Search</NavItem>
            <NavItem eventKey={2} href='#' onClick={this.onClickStatistics}>Statistics</NavItem>
          </Nav>
        </CollapsableNav>
      </Navbar>
    )
  }
})

var StatisticsPage = React.createClass({
  render: function() {
    var itemUrl = this.props.url + 'records'
    var countUrl = this.props.url + 'total'
    return (
      <div className='Page'>
        <NoBetNavbar />
        <PanelGroup>
          <Grid>
            <Row>
              <CounterBoxTotal eventKey='13' pollInterval={600000} url={countUrl}/>
            </Row>
            <Row>
              <CounterBoxPastAll eventKey='4' pollInterval={600000} url={countUrl}/>
              <OverallReturnBox option={{roi: 0}} eventKey='1' pollInterval={600000} url={itemUrl}/>
              <OverallReturnBox option={{roi: 5}} eventKey='2' pollInterval={600000} url={itemUrl}/>
              <OverallReturnBox option={{roi: 10}} eventKey='3' pollInterval={600000} url={itemUrl}/>
            </Row>
            <Row>
              <CounterBoxPast30Days eventKey='8' pollInterval={600000} url={countUrl}/>
              <OverallReturnBox option={{roi: 0, timeRange: 30}} eventKey='5' pollInterval={600000} url={itemUrl}/>
              <OverallReturnBox option={{roi: 5, timeRange: 30}} eventKey='6' pollInterval={600000} url={itemUrl}/>
              <OverallReturnBox option={{roi: 10, timeRange: 30}} eventKey='7' pollInterval={600000} url={itemUrl}/>
            </Row>
            <Row>
              <CounterBoxPast60Days eventKey='12' pollInterval={600000} url={countUrl}/>
              <OverallReturnBox option={{roi: 0, timeRange: 60}} eventKey='9' pollInterval={600000} url={itemUrl}/>
              <OverallReturnBox option={{roi: 5, timeRange: 60}} eventKey='10' pollInterval={600000} url={itemUrl}/>
              <OverallReturnBox option={{roi: 10, timeRange: 60}} eventKey='11' pollInterval={600000} url={itemUrl}/>
            </Row>
          </Grid>
        </PanelGroup>
      </div>
    )
  }
})

var OverallReturnBox = React.createClass({
  loadROIFromServer: function() {
    var url = this.props.url
    var query = {
      '$and': [
        {'BetItem.Result': {'$exists': 'true'}},
        {'BetItem.Result': {'$ne': 'Unknown'}},
        {'ROI': {'$gte': this.props.option.roi / 100}}
      ]
    }
    if (!!this.props.option.timeRange) {
      var afterDate = daysAgo(this.props.option.timeRange)
      query['$and'].push({'BetItem.MatchDate': {'$gte': afterDate}})
    }

    $.ajax({
      url: url,
      type: 'POST',
      data: JSON.stringify(query),
      dataType: 'json',
      success: function(stakes) {
        var actualReturn = 0
        stakes.forEach(function(stake, i, arr) {
          if (stake.Decision == stake.BetItem.Result) {
            if (stake.BetItem.Result == 'Win') {
              actualReturn += stake.BetItem.Odds.Win
            }
            if (stake.BetItem.Result == 'Draw') {
              actualReturn += stake.BetItem.Odds.Draw
            }
            if (stake.BetItem.Result == 'Lose') {
              actualReturn += stake.BetItem.Odds.Lose
            }
          }
        })
        if (stakes.length > 0) {
          actualReturn = Math.round((actualReturn / stakes.length - 1) * 10000) / 100
        }
        this.setState({ROI: actualReturn})
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString())
      }.bind(this)
    })
  },
  getInitialState: function() {
    return {
      ROI: 0
    }
  },
  componentDidMount: function() {
    this.loadROIFromServer();
    setInterval(this.loadROIFromServer, this.props.pollInterval);
  },
  render: function() {
    var header = 'Return | Conf. > ' + this.props.option.roi * 5 + '%'
    if (!!this.props.option.timeRange) {
      header += ' | Past ' + this.props.option.timeRange + ' days'
    }
    else {
      header += ' | Overall'
    }
    var roi = this.state.ROI + '%'
    if (this.state.ROI < 0) {
      return (
        <Col xs={6} md={3}>
          <Panel header={header} eventKey={this.props.eventKey} bsStyle='danger'>
            <h4>{roi}</h4>
          </Panel>
        </Col>
      )
    }
    else if (this.state.ROI < 5) {
      return (
        <Col xs={6} md={3}>
          <Panel header={header} eventKey={this.props.eventKey} bsStyle='warning'>
            <h4>{roi}</h4>
          </Panel>
        </Col>
      )
    }
    else {
      return (
        <Col xs={6} md={3}>
          <Panel header={header} eventKey={this.props.eventKey} bsStyle='success'>
            <h4>{roi}</h4>
          </Panel>
        </Col>
      )
    }
  }
})

var CounterBox = React.createClass({
  loadTotalFromServer: function() {
    var url = this.props.url
    var query = this.props.query

    $.ajax({
      url: url,
      type: 'POST',
      data: JSON.stringify(query),
      dataType: 'json',
      success: function(count) {
        if (count.length > 0) {
          this.setState({counter: count[0].value})
        }
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString())
      }.bind(this)
    })
  },
  getInitialState: function() {
    return {
      counter: 0
    }
  },
  componentDidMount: function() {
    this.loadTotalFromServer();
    setInterval(this.loadTotalFromServer, this.props.pollInterval);
  },
  render: function() {
    return (
      <Col xs={6} md={3}>
        <Panel header={this.props.header} eventKey={this.props.eventKey} bsStyle='info'>
          <h4>{this.state.counter}</h4>
        </Panel>
      </Col>
    )
  }
})

var CounterBoxTotal = React.createClass({
  render: function() {
    var header = 'Total Matches'
    var query = {}
    return (
      <CounterBox query={query} header={header} eventKey={this.props.eventKey} pollInterval={this.props.pollInterval} url={this.props.url} />
    )
  }
})

var CounterBoxPastAll = React.createClass({
  render: function() {
    var header = 'All Past Matches'
    var query = {
      '$and': [
        {'BetItem.Result': {'$exists': 'true'}},
        {'BetItem.Result': {'$ne': 'Unknown'}}
      ]
    }
    return (
      <CounterBox query={query} header={header} eventKey={this.props.eventKey} pollInterval={this.props.pollInterval} url={this.props.url} />
    )
  }
})

var CounterBoxPast30Days = React.createClass({
  render: function() {
    var header = 'Matches in last 30 days'
    var query = {
      '$and': [
        {'BetItem.Result': {'$exists': 'true'}},
        {'BetItem.Result': {'$ne': 'Unknown'}},
        {'BetItem.MatchDate': {'$gte': daysAgo(30)}}
      ]
    }
    return (
      <CounterBox query={query} header={header} eventKey={this.props.eventKey} pollInterval={this.props.pollInterval} url={this.props.url} />
    )
  }
})

var CounterBoxPast60Days = React.createClass({
  render: function() {
    var header = 'Matches in last 60 days'
    var query = {
      '$and': [
        {'BetItem.Result': {'$exists': 'true'}},
        {'BetItem.Result': {'$ne': 'Unknown'}},
        {'BetItem.MatchDate': {'$gte': daysAgo(60)}}
      ]
    }
    return (
      <CounterBox query={query} header={header} eventKey={this.props.eventKey} pollInterval={this.props.pollInterval} url={this.props.url} />
    )
  }
})

React.render(
  <SearchPage url='/'/>,
  document.getElementById('pageContainer')
)
